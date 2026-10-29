import { Inject, Injectable } from "@nestjs/common";
import {
  formatTaka,
  nextOrderStatus,
  toDhakaIsoString,
  type OrderActionInput,
  type OrderListQuery,
  type OrderUpdateInput,
  type RefundRecordInput,
  type Product,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import { ENV, type Env } from "../config/env";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { invoiceModel, packingSlipModel, type OrderForDocuments } from "../orders/orderDocuments";
import { renderInvoicePdf, renderPackingSlipPdf } from "../orders/orderPdf";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationService } from "../notifications/notification.service";
import { RevalidateService } from "../revalidate/revalidate.service";

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

type OrderItem = { productId: string; variantId: string; quantity: number };

/** Why a step can't apply, in plain words with the next step. */
const ORDER_REFUSALS = {
  order: "That step doesn't come next for this order",
  courier: "Name the courier and enter the tracking number",
  reason: "Say why in a few words",
  finished: "This order is finished",
  proof: "Verify the payment proof first: that confirms the order",
  call: "Only cash on delivery orders are confirmed on the phone",
} as const;

/** What each step writes on the order's history. */
const STEP_NOTES: Record<OrderActionInput["type"], string> = {
  confirm: "Order confirmed",
  startPacking: "Packing started",
  ship: "Handed to the courier",
  deliver: "Delivered",
  cancel: "Cancelled",
  return: "Returned",
};

/** The status words of the order SMS (issue 252); steps without words send nothing. */
const ORDER_SMS_WORDS: Partial<Record<OrderActionInput["type"], string>> = {
  confirm: "confirmed",
  ship: "on its way",
  deliver: "delivered",
  cancel: "cancelled",
};

/**
 * Orders for the Waafa’s World team: list and search, detail with the history, steps along the workflow with what
 * each needs (D0 R4, ADMIN.md §8.4), notes. A cancelled or returned order puts its stock back.
 */
@Injectable()
export class AdminOrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
    @Inject(ENV) private readonly env: Env,
    @Inject(NotificationService) private readonly notifications: NotificationService,
  ) {}

  /**
   * The order's invoice or packing slip as a PDF (issue 248), drawn from the stored order (its price snapshot) and
   * the seller's settings at print time.
   */
  async document(
    id: string,
    kind: "invoice" | "packing-slip",
  ): Promise<{ name: string; pdf: Buffer }> {
    const row = await this.prisma.order.findUnique({ where: { id } });
    if (!row) throw problems.notFound("Order not found");
    const order: OrderForDocuments = {
      reference: row.reference,
      createdAt: row.createdAt,
      items: row.items as OrderForDocuments["items"],
      subtotal: row.subtotal,
      discount: row.discount,
      delivery: row.delivery,
      total: row.total,
      couponCode: row.couponCode,
      payment: row.payment as OrderForDocuments["payment"],
      paymentVerified: row.paymentVerified,
      address: row.address as OrderForDocuments["address"],
      pickup: row.pickup,
      invoice: (row.invoice as OrderForDocuments["invoice"]) ?? null,
    };
    if (kind === "packing-slip")
      return {
        name: `${row.reference}-packing-slip.pdf`,
        pdf: await renderPackingSlipPdf(packingSlipModel(order)),
      };
    const [site, contact, payment] = await Promise.all([
      this.content.setting("siteSettings"),
      this.content.setting("contactSettings"),
      this.content.setting("paymentSettings"),
    ]);
    const origin = this.env.WEB_ORIGINS[0] ?? "https://waafasworld.com";
    const pdf = await renderInvoicePdf(
      invoiceModel(order, {
        companyName: site.companyName,
        storeName: site.storeName,
        addressLines: [...contact.addressLines, `${contact.city}, ${contact.country}`],
        phone: contact.phoneDisplay,
        email: contact.email,
        website: new URL(origin).host,
        ...(payment.vatPercent !== undefined ? { vatPercent: payment.vatPercent } : {}),
      }),
    );
    return { name: `${row.reference}-invoice.pdf`, pdf };
  }

  async list(query: OrderListQuery) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
    };
    if (query.q) {
      const q = query.q.trim();
      const digits = q.replace(/\D/g, "");
      where.OR = [
        { reference: { contains: q.toUpperCase() } },
        { name: { contains: q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-10) } }] : []),
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: query.sort?.startsWith("total")
          ? { total: query.sort === "total.asc" ? "asc" : "desc" }
          : { createdAt: query.sort === "created.asc" ? "asc" : "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        reference: row.reference,
        status: row.status,
        name: row.name,
        phone: row.phone,
        total: row.total,
        items: (row.items as OrderItem[]).reduce((sum, item) => sum + item.quantity, 0),
        payment: (row.payment as { method: string }).method,
        paymentVerified: row.paymentVerified,
        pickup: row.pickup,
        createdAt: toDhakaIsoString(row.createdAt),
      })),
    };
  }

  async detail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { history: { orderBy: { at: "asc" } } },
    });
    if (!order) throw problems.notFound("Order not found");
    const proofs = await this.prisma.paymentProof.findMany({
      where: { reference: order.reference },
      orderBy: { createdAt: "desc" },
    });
    return {
      id: order.id,
      reference: order.reference,
      status: order.status,
      cashOnDelivery: (order.payment as { method?: string } | null)?.method === "cod",
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      delivery: order.delivery,
      total: order.total,
      couponCode: order.couponCode,
      payment: order.payment,
      paymentVerified: order.paymentVerified,
      address: order.address,
      pickup: order.pickup,
      invoice: order.invoice,
      createdAt: toDhakaIsoString(order.createdAt),
      history: order.history.map((event) => ({
        status: event.status,
        note: event.note,
        courier: event.courier,
        trackingNumber: event.trackingNumber,
        actor: event.actorName,
        at: toDhakaIsoString(event.at),
      })),
      proofs: proofs.map((proof) => ({
        id: proof.id,
        amount: proof.amount,
        accountId: proof.accountId,
        transactionId: proof.transactionId,
        status: proof.status,
        createdAt: toDhakaIsoString(proof.createdAt),
      })),
    };
  }

  /**
   * A refund staff made in the gateway's or bank's own panel (issue 251), written on the order: never more than was
   * paid in all, audited, and shown on the order's history.
   */
  async recordRefund(
    staff: StaffPrincipal,
    id: string,
    input: RefundRecordInput,
    now = new Date(),
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw problems.notFound("Order not found");
    if (!order.paymentVerified)
      throw problems.conflict("Only a paid order can be refunded", "unpaid");
    const payment = order.payment as { refunds?: Array<{ amount: number }> } & Record<
      string,
      unknown
    >;
    const refunded = (payment.refunds ?? []).reduce((sum, refund) => sum + refund.amount, 0);
    if (refunded + input.amount > order.total)
      throw problems.conflict(
        `Refunds can't pass the total: ${formatTaka(order.total - refunded)} is left`,
        "too-much",
      );
    const refund = { ...input, at: now.toISOString(), by: staff.name };
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { payment: json({ ...payment, refunds: [...(payment.refunds ?? []), refund] }) },
      });
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: order.status,
          note: `Refund of ${formatTaka(input.amount)} recorded · ${input.reference}${input.note ? ` · ${input.note}` : ""}`,
          actorName: staff.name,
          at: now,
        },
      });
    });
    await this.audit.record({
      actor: staff,
      action: "order.refund",
      entity: "Order",
      entityId: id,
      after: refund,
    });
    return this.detail(id);
  }

  /** A note on the order's history; the status moves only through `act`. */
  async update(staff: StaffPrincipal, id: string, input: OrderUpdateInput, now = new Date()) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw problems.notFound("Order not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: order.status,
          note: input.note,
          actorName: staff.name,
          at: now,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "order.note",
          entity: "order",
          entityId: order.reference,
          after: input,
        },
        tx,
      );
    });
    return this.detail(id);
  }

  /**
   * One step on an order (D0 R4): the status follows with the shared rules. Confirming needs a verified payment
   * proof, or a phone call for cash on delivery; shipping needs the courier and tracking number; cancelling and
   * returning need a reason and put the stock back; delivering cash on delivery records the cash as received.
   */
  async act(staff: StaffPrincipal, id: string, input: OrderActionInput, now = new Date()) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw problems.notFound("Order not found");
    const cash = (order.payment as { method?: string } | null)?.method === "cod";
    if (input.type === "confirm" && input.by === "proof" && !order.paymentVerified)
      throw problems.conflict(ORDER_REFUSALS.proof, "proof");
    if (input.type === "confirm" && input.by === "call" && !cash)
      throw problems.conflict(ORDER_REFUSALS.call, "call");
    const move = nextOrderStatus(order.status, input);
    if (!move.ok) throw problems.conflict(ORDER_REFUSALS[move.reason], move.reason);
    const paid = input.type === "deliver" && cash && !order.paymentVerified;
    await this.prisma.$transaction(async (tx) => {
      // Only from the status read above: two staff pressing at once move the order (and restock) once (#78).
      const changed = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status: move.status, ...(paid ? { paymentVerified: true } : {}) },
      });
      if (changed.count === 0)
        throw problems.conflict("Someone else changed this order first; reload to see it", "stale");
      const note =
        input.type === "confirm" && input.by === "call"
          ? "Confirmed on the phone"
          : "reason" in input
            ? `${STEP_NOTES[input.type]}: ${input.reason}`
            : paid
              ? "Delivered, cash received"
              : STEP_NOTES[input.type];
      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: move.status,
          note,
          courier: input.type === "ship" ? input.courier : null,
          trackingNumber: input.type === "ship" ? input.trackingNumber : null,
          actorName: staff.name,
          at: now,
        },
      });
      if (move.restock) await this.restock(tx, order.items as OrderItem[]);
      await this.audit.record(
        {
          actor: staff,
          action: `order.${input.type}`,
          entity: "order",
          entityId: order.reference,
          before: { status: order.status, paymentVerified: order.paymentVerified },
          after: { status: move.status, ...input },
          ...("reason" in input ? { reason: input.reason } : {}),
        },
        tx,
      );
    });
    if (move.restock) {
      this.content.invalidate();
      this.revalidate.request(["products"]);
    }
    // The customer hears each real step by SMS while an SMS card is on (issue 252); packing is internal.
    const words = ORDER_SMS_WORDS[input.type];
    if (words) {
      void this.notifications.sms("order-status-sms", order.phone, {
        name: order.name,
        order_number: order.reference,
        status:
          input.type === "ship"
            ? `${words} with ${input.courier}, tracking ${input.trackingNumber}`
            : words,
      });
    }
    return this.detail(id);
  }

  /** Puts the quantities of a cancelled order back on the variants (pre-orders took none). */
  private async restock(tx: Prisma.TransactionClient, items: OrderItem[]): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ docId: string; data: Product }>>`
      SELECT "docId", "data" FROM "ContentDocument" WHERE "collection" = 'products' FOR UPDATE`;
    for (const row of rows) {
      const mine = items.filter((item) => item.productId === row.data.id);
      if (mine.length === 0) continue;
      const variants = row.data.variants.map((variant) => {
        const item = mine.find((line) => line.variantId === variant.id);
        return item && !variant.preOrder
          ? { ...variant, stock: variant.stock + item.quantity }
          : variant;
      });
      await tx.contentDocument.update({
        where: { collection_docId: { collection: "products", docId: row.docId } },
        data: {
          data: json({ ...row.data, variants }),
          version: { increment: 1 },
          updatedBy: "order-cancel",
        },
      });
    }
  }
}
