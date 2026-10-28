import { Inject, Injectable } from "@nestjs/common";
import {
  LEAD_PREFIX,
  formatTaka,
  isScheduledNow,
  leadDigest,
  priceCart,
  proofMatches,
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
  type TrackResult,
  type TrackedRequest,
} from "@waafa/shared";
import { nextReference } from "../common/references";
import { visaTrack } from "../common/visaProgress";
import { ContentService } from "../content/content.service";
import { CustomerFilesService, type FileRef } from "../files/customer-files.service";
import type { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { adminHref, LiveBus } from "../realtime/liveBus";
import { RoundRobinService } from "../realtime/roundRobin.service";
import { RevalidateService } from "../revalidate/revalidate.service";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const DUPLICATE_WINDOW_MS = 24 * 60 * 60_000;

export type PlaceOrderResult =
  | { ok: true; order: OrderCreated }
  | { ok: false; reason: "changed" | "cod" | "minimum" | "pickup"; quote?: Quote };

/** The files a lead's form sent: visa documents, printing and trading attachments (issue 232). */
function leadFileRefs(payload: LeadCreateInput["payload"]): FileRef[] {
  const refs: FileRef[] = [];
  if ("documents" in payload && Array.isArray(payload.documents)) refs.push(...payload.documents);
  if ("attachments" in payload && Array.isArray(payload.attachments))
    refs.push(...payload.attachments);
  return refs;
}

/** Staff-facing note when some files of a form never arrived (expired or failed uploads). */
const missingNote = (names: string[]) =>
  `${names.length === 1 ? "1 file" : `${names.length} files`} did not arrive (${names.join(", ")}); ask the customer to send ${names.length === 1 ? "it" : "them"} again.`;

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
    @Inject(CustomerFilesService) private readonly files: CustomerFilesService,
    @Inject(LiveBus) private readonly live: LiveBus,
    @Inject(RoundRobinService) private readonly roundRobin: RoundRobinService,
  ) {}

  private adminLink(path: string): string {
    return this.notifications.adminLink(path);
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
      const refs = leadFileRefs(input.payload);
      if (refs.length > 0) {
        const files = await this.files.claim(tx, refs, "lead", lead.id, now);
        if (files.missing.length > 0) {
          await tx.leadActivity.create({
            data: {
              leadId: lead.id,
              type: "note",
              body: missingNote(files.missing),
              actorName: "Website",
              createdAt: now,
            },
          });
        }
      }
      return { id: lead.id, reference };
    });

    const vars = {
      name: input.contact.name,
      reference: created.reference,
      summary: digest.summary,
      module,
      link: this.adminLink(`/leads/${created.id}`),
    };
    void this.notifications.notify("lead-received-customer", input.contact.email, vars);
    void this.notifications.notifyStaff("lead-alert-staff", module, vars);
    // Issue 243: the open admin tabs of that service hear it at once, then it goes to the next person in turn.
    this.live.publish({
      audience: { module },
      event: {
        type: "lead",
        title: `${input.contact.name} · ${created.reference}`,
        detail: digest.summary.slice(0, 300),
        href: adminHref(`/leads/${created.id}`),
        at: toDhakaIsoString(now),
      },
    });
    await this.roundRobin.assign(created.id, now).catch(() => null);
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
      // Only products on sale: a draft (a copy being prepared) is never priced or loses stock.
      const products = rows
        .map((row) => row.data)
        .filter(
          (product) =>
            product.status === "published" &&
            product.variants.some((variant) => wanted.has(variant.id)),
        );
      const [deals, coupons] = await Promise.all([
        tx.contentDocument.findMany({ where: { collection: "deals" } }),
        tx.contentDocument.findMany({ where: { collection: "coupons" } }),
      ]);
      const activeDeals = deals
        .map((row) => row.data as Deal)
        .filter((deal) => Date.parse(deal.endsAt) > now.getTime());
      const code = input.couponCode?.trim().toUpperCase();
      const found = code
        ? (coupons
            .map((row) => row.data as Coupon)
            .find((item) => item.code === code && item.enabled && isScheduledNow(item, now)) ??
          null)
        : null;
      // A code with a use limit stops at it (D223); orders are taken one at a time (the product lock above).
      const coupon =
        found && found.maxUses !== undefined
          ? (await tx.order.count({
              where: { couponCode: found.code, status: { not: "cancelled" } },
            })) < found.maxUses
            ? found
            : null
          : found;
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

      // Take the stock (pre-orders have none to take); note variants that reach their low-stock mark now.
      const lowStock: Array<{ title: string; sku: string; stock: number; slug: string }> = [];
      for (const product of products) {
        let changed = false;
        const variants = product.variants.map((variant) => {
          const line = quote.lines.find((item) => item.variantId === variant.id);
          if (!line || variant.preOrder) return variant;
          changed = true;
          const stock = Math.max(0, variant.stock - line.quantity);
          const mark = variant.lowStockAt ?? 3;
          if (variant.stock > mark && stock <= mark) {
            lowStock.push({ title: product.title, sku: variant.sku, stock, slug: product.slug });
          }
          return { ...variant, stock };
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
          ...(input.source ? { source: json(input.source) } : {}),
          createdAt: now,
          history: { create: { status: "placed", at: now, actorName: "Website" } },
        },
      });
      // A missing slip shows as "not received" in the admin's file list; order history is what customers see.
      if (input.payment.method === "offline" && input.payment.proof) {
        await this.files.claim(tx, [input.payment.proof], "order", order.id, now);
      }
      return {
        ok: true as const,
        order: { reference, total: order.total, createdAt: toDhakaIsoString(now) },
        id: order.id,
        lowStock,
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
    void this.notifications.notify("order-placed-customer", input.address.email, vars);
    void this.notifications.notifyStaff("order-placed-staff", "orders", vars);
    this.live.publish({
      audience: { roles: ["shop-manager", "accounts"] },
      event: {
        type: "order",
        title: `${input.address.name} · ${result.order.reference}`,
        detail: `${formatTaka(result.order.total)}, ${vars.method}`,
        href: adminHref(`/orders/${result.id}`),
        at: toDhakaIsoString(now),
      },
    });
    // Variants that this order took down to their low-stock mark (FR-SHOP-10, issue 233).
    for (const item of result.lowStock) {
      void this.notifications.notifyStaff("low-stock-staff", "stock", {
        product: item.title,
        sku: item.sku,
        stock: String(item.stock),
        order_number: result.order.reference,
        link: this.adminLink(`/content/products/${item.slug}`),
      });
    }
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

  /**
   * /track (issue 240): an order (ORD-…) or a request by its reference and the phone on it. A request answers with its
   * status and step dates only; a wrong phone and an unknown reference both give null.
   */
  async track(reference: string, phone: string): Promise<TrackResult | null> {
    const ref = reference.trim().toUpperCase();
    if (ref.startsWith("ORD-")) {
      const order = await this.trackOrder(ref, phone);
      return order ? { kind: "order", order } : null;
    }
    const lead = await this.prisma.lead.findUnique({
      where: { reference: ref },
      select: {
        reference: true,
        module: true,
        status: true,
        phone: true,
        payload: true,
        progress: true,
        createdAt: true,
        firstResponseAt: true,
        closedAt: true,
      },
    });
    if (
      !lead ||
      lead.status === "spam" ||
      phoneTail(lead.phone).length !== 10 ||
      phoneTail(lead.phone) !== phoneTail(phone)
    ) {
      return null;
    }
    const visa = lead.module === "visa" ? await visaTrack(this.prisma, lead) : null;
    return {
      kind: "request",
      reference: lead.reference,
      module: lead.module as TrackedRequest["module"],
      status: lead.status as TrackedRequest["status"],
      createdAt: toDhakaIsoString(lead.createdAt),
      respondedAt: lead.firstResponseAt ? toDhakaIsoString(lead.firstResponseAt) : null,
      closedAt: lead.closedAt ? toDhakaIsoString(lead.closedAt) : null,
      visa,
    };
  }

  async createFeedback(
    input: FeedbackCreateInput,
    now = new Date(),
  ): Promise<{ firstName: string }> {
    await this.prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
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
      if (input.photo) await this.files.claim(tx, [input.photo], "feedback", feedback.id, now);
    });
    void this.notifications.notifyStaff("feedback-received-staff", "feedback", {
      name: input.name,
      service: input.service,
      stars: input.rating ? String(input.rating) : "no",
      link: this.adminLink("/feedback"),
    });
    return { firstName: input.name.split(/\s+/)[0] ?? input.name };
  }

  async createPaymentProof(input: PaymentProofInput, now = new Date()) {
    const [payment, order] = await Promise.all([
      this.content.setting("paymentSettings"),
      this.prisma.order.findUnique({
        where: { reference: input.reference.trim().toUpperCase() },
        select: { id: true, reference: true, total: true },
      }),
    ]);
    // Matched by itself when the reference names an order and the amount covers its total (D0 R4, D222).
    const matched = order !== null && proofMatches(input, order);
    const stored = await this.prisma.$transaction(async (tx) => {
      const proof = await tx.paymentProof.create({
        data: {
          reference: input.reference,
          name: input.name,
          phone: input.phone,
          amount: input.amount,
          accountId: input.accountId,
          transactionId: input.transactionId ?? null,
          ...(input.proof ? { proof: json(input.proof) } : {}),
          status: matched ? "matched" : "received",
          orderId: order?.id ?? null,
          createdAt: now,
        },
      });
      if (input.proof) await this.files.claim(tx, [input.proof], "payment-proof", proof.id, now);
      return proof;
    });
    this.live.publish({
      audience: { roles: ["accounts"] },
      event: {
        type: "proof",
        title: `${input.name} · ${input.reference}`,
        detail: formatTaka(input.amount),
        href: adminHref("/payments"),
        at: toDhakaIsoString(now),
      },
    });
    void this.notifications.notifyStaff("payment-proof-staff", "payments", {
      name: input.name,
      reference: input.reference,
      amount: formatTaka(input.amount),
      method:
        payment.offlineAccounts.find((account) => account.id === input.accountId)?.title ??
        input.accountId,
      trx_id: input.transactionId ?? "slip only",
      link: this.adminLink("/payments"),
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
