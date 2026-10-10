import { Inject, Injectable } from "@nestjs/common";
import {
  LEAD_PREFIX,
  formatTaka,
  isScheduledNow,
  leadDigest,
  priceCart,
  toDhakaIsoString,
  withDeals,
  zoneForArea,
  type Coupon,
  type Deal,
  type DeliveryChoice,
  type FeedbackCreateInput,
  type LeadCreateInput,
  type LeadCreated,
  type Order,
  type OrderCreateInput,
  type OrderCreated,
  type PaymentProofInput,
  type Product,
  type Quote,
  type SearchLogInput,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { nextReference } from "../common/references";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60_000;

export type PlaceOrderResult =
  | { ok: true; order: OrderCreated }
  | { ok: false; reason: "changed" | "cod" | "minimum" | "pickup"; quote?: Quote };

/** Last ten digits, so +8801712345678 and 01712-345678 match (Track order). */
const phoneTail = (value: string) => value.replace(/\D/g, "").slice(-10);

/**
 * Everything a visitor submits (B3): leads for every module with atomic references and a duplicate flag, orders priced
 * on the server with stock taken in the same transaction, tracking, feedback for moderation, payment proofs, search
 * logs and newsletter sign-ups. Customer and staff emails go out after the write commits.
 */
@Injectable()
export class IntakeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(NotificationService) private readonly notifications: NotificationService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private adminLink(path: string): string {
    const origin = this.env.WEB_ORIGINS[0] ?? "";
    return `${origin}/admin${path}`;
  }

  async createLead(input: LeadCreateInput, now = new Date()): Promise<LeadCreated> {
    const module = input.payload.module;
    const digest = leadDigest(input.payload);
    const created = await this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.lead.findFirst({
        where: {
          phone: input.contact.phone,
          module,
          createdAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, reference: true },
      });
      const reference = await nextReference(tx, LEAD_PREFIX[module], now);
      const lead = await tx.lead.create({
        data: {
          reference,
          module,
          name: input.contact.name,
          phone: input.contact.phone,
          email: input.contact.email ?? null,
          contact: json(input.contact),
          payload: json(input.payload),
          source: json(input.source),
          summary: digest.summary,
          travelDate: digest.travelDate ?? null,
          travellers: digest.travellers ?? null,
          duplicateOfId: duplicate?.id ?? null,
          createdAt: now,
        },
      });
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "created",
          body: duplicate
            ? `Received from the website. Same phone and module as ${duplicate.reference} in the last 24 hours.`
            : "Received from the website.",
          actorName: "Website",
          createdAt: now,
        },
      });
      return { id: lead.id, reference };
    });

    const vars = {
      name: input.contact.name,
      reference: created.reference,
      summary: digest.summary,
      module,
      link: this.adminLink(`/leads/${created.id}`),
    };
    await this.notifications.notify("lead-received-customer", input.contact.email, vars);
    await this.notifications.notify("lead-alert-staff", this.notifications.staffAddress, vars);
    return { reference: created.reference, createdAt: toDhakaIsoString(now) };
  }

  async placeOrder(input: OrderCreateInput, now = new Date()): Promise<PlaceOrderResult> {
    const [shipping, payment] = await Promise.all([
      this.content.setting("shippingSettings"),
      this.content.setting("paymentSettings"),
    ]);
    if (input.pickup && !shipping.officePickup) return { ok: false, reason: "pickup" };
    const delivery: DeliveryChoice = input.pickup
      ? { kind: "pickup" }
      : { kind: "zone", zoneId: zoneForArea(shipping, input.address).id };
    const wanted = new Set(input.lines.map((line) => line.variantId));

    const result = await this.prisma.$transaction(async (tx) => {
      // Lock the products this order touches, so two orders can't sell the same last item.
      const rows = await tx.$queryRaw<Array<{ docId: string; data: Product }>>`
        SELECT "docId", "data" FROM "ContentDocument" WHERE "collection" = 'products' FOR UPDATE`;
      const products = rows
        .map((row) => row.data)
        .filter((product) => product.variants.some((variant) => wanted.has(variant.id)));
      const [deals, coupons] = await Promise.all([
        tx.contentDocument.findMany({ where: { collection: "deals" } }),
        tx.contentDocument.findMany({ where: { collection: "coupons" } }),
      ]);
      const activeDeals = deals
        .map((row) => row.data as Deal)
        .filter((deal) => Date.parse(deal.endsAt) > now.getTime());
      const code = input.couponCode?.trim().toUpperCase();
      const coupon = code
        ? (coupons
            .map((row) => row.data as Coupon)
            .find((item) => item.code === code && item.enabled && isScheduledNow(item, now)) ??
          null)
        : null;
      const quote = priceCart({
        lines: input.lines,
        products: products.map((product) => withDeals(product, activeDeals)),
        coupon,
        ...(input.couponCode ? { couponCode: input.couponCode } : {}),
        delivery,
        shipping,
        payment,
      });
      if (!quote.ready) return { ok: false as const, reason: "changed" as const, quote };
      if (quote.belowMinimum !== null)
        return { ok: false as const, reason: "minimum" as const, quote };
      if (input.payment.method === "cod" && (!quote.cod.allowed || input.pickup)) {
        return { ok: false as const, reason: "cod" as const, quote };
      }

      // Take the stock (pre-orders have none to take).
      for (const product of products) {
        let changed = false;
        const variants = product.variants.map((variant) => {
          const line = quote.lines.find((item) => item.variantId === variant.id);
          if (!line || variant.preOrder) return variant;
          changed = true;
          return { ...variant, stock: Math.max(0, variant.stock - line.quantity) };
        });
        if (changed) {
          await tx.contentDocument.update({
            where: { collection_docId: { collection: "products", docId: product.slug } },
            data: {
              data: json({ ...product, variants }),
              version: { increment: 1 },
              updatedBy: "order",
            },
          });
        }
      }

      const reference = await nextReference(tx, "ORD", now);
      const order = await tx.order.create({
        data: {
          reference,
          items: json(
            quote.lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              title: line.title,
              ...(line.variantLabel ? { variantLabel: line.variantLabel } : {}),
              sku: line.sku,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
              ...(line.image ? { image: line.image } : {}),
            })),
          ),
          subtotal: quote.subtotal,
          discount: quote.discount,
          delivery: quote.delivery,
          total: quote.total,
          couponCode: quote.coupon.state === "applied" ? quote.coupon.code : null,
          payment: json(input.payment),
          address: json(input.address),
          name: input.address.name,
          phone: input.address.phone,
          email: input.address.email ?? null,
          pickup: input.pickup,
          ...(input.invoice ? { invoice: json(input.invoice) } : {}),
          createdAt: now,
          history: { create: { status: "placed", at: now, actorName: "Website" } },
        },
      });
      return {
        ok: true as const,
        order: { reference, total: order.total, createdAt: toDhakaIsoString(now) },
        id: order.id,
      };
    });

    if (!result.ok) return result;
    this.content.invalidate();
    this.revalidate.request(["products"]);
    const choice = input.payment;
    const vars = {
      name: input.address.name,
      order_number: result.order.reference,
      total: formatTaka(result.order.total),
      method:
        choice.method === "cod"
          ? "cash on delivery"
          : (payment.offlineAccounts.find((account) => account.id === choice.accountId)?.title ??
            "transfer"),
      link: this.adminLink(`/orders/${result.id}`),
    };
    await this.notifications.notify("order-placed-customer", input.address.email, vars);
    await this.notifications.notify("order-placed-staff", this.notifications.staffAddress, vars);
    return { ok: true, order: result.order };
  }

  /** Track order: the reference and the phone on it must both match. */
  async trackOrder(reference: string, phone: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { reference: reference.trim().toUpperCase() },
      include: { history: { orderBy: { at: "asc" } } },
    });
    if (
      !order ||
      phoneTail(order.phone).length !== 10 ||
      phoneTail(order.phone) !== phoneTail(phone)
    ) {
      return null;
    }
    return {
      id: order.id,
      reference: order.reference,
      items: order.items as Order["items"],
      subtotal: order.subtotal,
      discount: order.discount,
      delivery: order.delivery,
      total: order.total,
      ...(order.couponCode ? { couponCode: order.couponCode } : {}),
      payment: order.payment as Order["payment"],
      paymentVerified: order.paymentVerified,
      address: order.address as Order["address"],
      pickup: order.pickup,
      ...(order.invoice ? { invoice: order.invoice as Order["invoice"] } : {}),
      status: order.status as Order["status"],
      history: order.history.map((event) => ({
        status: event.status as Order["status"],
        at: toDhakaIsoString(event.at),
        ...(event.note ? { note: event.note } : {}),
        ...(event.courier ? { courier: event.courier } : {}),
        ...(event.trackingNumber ? { trackingNumber: event.trackingNumber } : {}),
      })),
      createdAt: toDhakaIsoString(order.createdAt),
      sample: false,
    };
  }

  async createFeedback(
    input: FeedbackCreateInput,
    now = new Date(),
  ): Promise<{ firstName: string }> {
    const stored = await this.prisma.feedback.create({
      data: {
        name: input.name,
        phone: input.phone,
        service: input.service,
        reference: input.reference ?? null,
        rating: input.rating ?? null,
        comment: input.comment,
        ...(input.photo ? { photo: json(input.photo) } : {}),
        consentToPublish: input.consentToPublish,
        createdAt: now,
      },
    });
    await this.notifications.notify("feedback-received-staff", this.notifications.staffAddress, {
      name: input.name,
      service: input.service,
      stars: input.rating ? String(input.rating) : "no",
      link: this.adminLink(`/feedback/${stored.id}`),
    });
    return { firstName: input.name.split(/\s+/)[0] ?? input.name };
  }

  async createPaymentProof(input: PaymentProofInput, now = new Date()) {
    const payment = await this.content.setting("paymentSettings");
    const stored = await this.prisma.paymentProof.create({
      data: {
        reference: input.reference,
        name: input.name,
        phone: input.phone,
        amount: input.amount,
        accountId: input.accountId,
        transactionId: input.transactionId ?? null,
        ...(input.proof ? { proof: json(input.proof) } : {}),
        createdAt: now,
      },
    });
    await this.notifications.notify("payment-proof-staff", this.notifications.staffAddress, {
      name: input.name,
      reference: input.reference,
      amount: formatTaka(input.amount),
      method:
        payment.offlineAccounts.find((account) => account.id === input.accountId)?.title ??
        input.accountId,
      trx_id: input.transactionId ?? "slip only",
      link: this.adminLink(`/payments/${stored.id}`),
    });
    return { reference: stored.reference, receivedAt: toDhakaIsoString(now) };
  }

  async logSearch(input: SearchLogInput, now = new Date()): Promise<void> {
    await this.prisma.searchLog.create({
      data: {
        module: input.module,
        summary: input.summary,
        params: json(input.params),
        device: input.device,
        source: input.source,
        createdAt: now,
      },
    });
  }

  async subscribe(email: string, source?: string): Promise<void> {
    await this.prisma.subscriber.upsert({
      where: { email: email.trim().toLowerCase() },
      update: { unsubscribedAt: null },
      create: { email: email.trim().toLowerCase(), source: source ?? null },
    });
  }
}
