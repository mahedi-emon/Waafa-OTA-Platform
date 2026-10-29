import { createHmac, timingSafeEqual } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ENV, type Env } from "../config/env";
import { AdminOrdersService } from "../admin/orders.service";
import { MESSAGING, type Messaging } from "../notifications/integrationSms";
import { PrismaService } from "../prisma/prisma.service";
import { CourierError, parcelState, steadfast, type ParcelState } from "./steadfast";

/** The couriers that can book a parcel from the order page (issue 253); Pathao and RedX follow (D325). */
export const BOOKABLE_COURIERS = ["steadfast"] as const;
export type BookableCourier = (typeof BOOKABLE_COURIERS)[number];
export const COURIER_NAMES: Record<BookableCourier, string> = { steadfast: "Steadfast" };

/** Who the order history names for changes the courier reports. */
const COURIER_ACTOR = { id: null, name: "Courier update" } as const;
/** Shipped orders are checked this often by the minute job (the webhook is faster when it is set). */
const SYNC_EVERY_MS = 30 * 60_000;
/** A parcel older than this is no longer polled. */
const SYNC_DAYS = 45;

type Address = {
  division?: string;
  district?: string;
  area?: string;
  street?: string;
  note?: string;
};

/**
 * Courier booking and tracking (FR-SHOP-14, issue 253): book a parcel from the order page (the order moves to Shipped
 * with the tracking code, and the customer gets the "on its way" SMS), then the courier's status reaches the order's
 * history through the webhook or, every 30 minutes, by asking the courier; "delivered" marks the order Delivered.
 * Everything is off until the Steadfast card is on in Admin › Integrations.
 */
@Injectable()
export class CouriersService {
  private readonly logger = new Logger("Couriers");
  private lastSync = 0;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AdminOrdersService) private readonly orders: AdminOrdersService,
    @Inject(MESSAGING) private readonly messaging: Messaging,
  ) {}

  private adapter() {
    return steadfast(this.messaging.fetcher);
  }

  private async config(courier: BookableCourier) {
    return this.messaging.active.get("courier", [courier]);
  }

  /** The couriers that are on, for the order page's "Book with …" button. */
  async available(): Promise<{ couriers: BookableCourier[] }> {
    const ready: BookableCourier[] = [];
    for (const courier of BOOKABLE_COURIERS) if (await this.config(courier)) ready.push(courier);
    return { couriers: ready };
  }

  /** Books the order's parcel and marks it Shipped with the courier's tracking code. */
  async book(staff: StaffPrincipal, orderId: string, courier: BookableCourier, note?: string) {
    const integration = await this.config(courier);
    if (!integration)
      throw problems.conflict(
        "Steadfast is not on. Turn it on in Admin › Integrations first.",
        "courier-off",
      );
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw problems.notFound("Order not found");
    if (order.status !== "confirmed" && order.status !== "processing")
      throw problems.conflict("Book the courier once the order is confirmed or packing.", "order");
    const address = (order.address ?? {}) as Address;
    const cash = (order.payment as { method?: string } | null)?.method === "cod";
    let parcel;
    try {
      parcel = await this.adapter().book(
        {
          invoice: order.reference,
          name: order.name,
          phone: order.phone,
          address: [address.street, address.area, address.district, address.division]
            .filter(Boolean)
            .join(", "),
          cod: cash && !order.paymentVerified ? order.total : 0,
          ...((note ?? address.note) ? { note: note ?? address.note } : {}),
        },
        integration.context,
      );
    } catch (error) {
      if (error instanceof CourierError) throw problems.conflict(error.message, "courier");
      throw error;
    }
    await this.audit.record({
      actor: staff,
      action: "order.courier-booked",
      entity: "order",
      entityId: order.reference,
      after: { courier, consignmentId: parcel.consignmentId, trackingCode: parcel.trackingCode },
    });
    return this.orders.act(staff, orderId, {
      type: "ship",
      courier: COURIER_NAMES[courier],
      trackingNumber: parcel.trackingCode,
    });
  }

  /** The webhook's shared token: the owner pastes it into the courier's panel; derived, so nothing new to store. */
  webhookToken(courier: BookableCourier): string | null {
    if (!this.env.PROVIDER_SECRET_KEY) return null;
    return createHmac("sha256", this.env.PROVIDER_SECRET_KEY)
      .update(`courier-webhook:${courier}`)
      .digest("base64url")
      .slice(0, 40);
  }

  /** A status the courier pushed (issue 253). Answers false when the token is wrong, so the caller says 401. */
  async webhook(
    courier: BookableCourier,
    token: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const expected = this.webhookToken(courier);
    const given = Buffer.from(token);
    if (
      !expected ||
      given.length !== expected.length ||
      !timingSafeEqual(given, Buffer.from(expected))
    )
      return false;
    const invoice = typeof payload.invoice === "string" ? payload.invoice : "";
    const status =
      typeof payload.status === "string"
        ? payload.status
        : typeof payload.delivery_status === "string"
          ? payload.delivery_status
          : "";
    if (!invoice || !status) return true;
    const order = await this.prisma.order.findUnique({ where: { reference: invoice } });
    if (order?.status === "shipped") await this.apply(order.id, courier, parcelState(status));
    return true;
  }

  /** The minute job: every 30 minutes, asks the courier about shipped parcels it booked. */
  async syncDue(now = new Date()): Promise<number> {
    if (now.getTime() - this.lastSync < SYNC_EVERY_MS) return 0;
    this.lastSync = now.getTime();
    let changed = 0;
    for (const courier of BOOKABLE_COURIERS) {
      const integration = await this.config(courier);
      if (!integration) continue;
      const shipped = await this.prisma.order.findMany({
        where: {
          status: "shipped",
          updatedAt: { gte: new Date(now.getTime() - SYNC_DAYS * 86_400_000) },
          history: { some: { courier: COURIER_NAMES[courier], status: "shipped" } },
        },
        select: { id: true, reference: true },
        take: 200,
      });
      for (const order of shipped) {
        try {
          const state = await this.adapter().status(order.reference, integration.context);
          if (await this.apply(order.id, courier, state)) changed += 1;
        } catch (error) {
          this.logger.warn(`Courier status for ${order.reference} failed: ${String(error)}`);
        }
      }
    }
    return changed;
  }

  /** Writes a new courier status on the order once; "delivered" moves the order to Delivered. */
  private async apply(
    orderId: string,
    courier: BookableCourier,
    state: ParcelState,
  ): Promise<boolean> {
    const note = `${COURIER_NAMES[courier]}: ${state.words}`;
    const last = await this.prisma.orderEvent.findFirst({
      where: { orderId },
      orderBy: { at: "desc" },
      select: { note: true },
    });
    if (state.final === "delivered") {
      await this.orders.act(COURIER_ACTOR, orderId, { type: "deliver" }).catch(() => null);
      return true;
    }
    if (last?.note === note) return false;
    await this.prisma.orderEvent.create({
      data: { orderId, status: "shipped", note, actorName: COURIER_ACTOR.name, at: new Date() },
    });
    return true;
  }
}
