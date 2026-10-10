import { Inject, Injectable } from "@nestjs/common";
import {
  toDhakaIsoString,
  type OrderListQuery,
  type OrderStatus,
  type OrderUpdateInput,
  type Product,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";

/** Allowed next statuses (FR-SHOP-09). Cancelled and returned are final. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

type OrderItem = { productId: string; variantId: string; quantity: number };

/**
 * Orders for the Waafas World team: list and search, detail with the history, status changes along the workflow
 * with courier and tracking number, payment verified. A cancelled order puts its stock back.
 */
@Injectable()
export class AdminOrdersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
  ) {}

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
        orderBy: { createdAt: "desc" },
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
      next: NEXT[order.status as OrderStatus],
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

  async update(staff: StaffPrincipal, id: string, input: OrderUpdateInput, now = new Date()) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw problems.notFound("Order not found");
    const current = order.status as OrderStatus;
    const moving = input.status !== undefined && input.status !== current;
    if (moving && !NEXT[current].includes(input.status as OrderStatus)) {
      throw problems.conflict(
        `An order that is ${current} can't become ${input.status}`,
        "transition",
      );
    }
    const restock = moving && input.status === "cancelled";
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          ...(moving ? { status: input.status } : {}),
          ...(input.paymentVerified !== undefined
            ? { paymentVerified: input.paymentVerified }
            : {}),
        },
      });
      if (
        moving ||
        input.note ||
        input.courier ||
        input.trackingNumber ||
        input.paymentVerified !== undefined
      ) {
        await tx.orderEvent.create({
          data: {
            orderId: id,
            status: moving ? (input.status as string) : current,
            note:
              input.note ??
              (input.paymentVerified === true
                ? "Payment verified"
                : input.paymentVerified === false
                  ? "Payment marked not verified"
                  : null),
            courier: input.courier ?? null,
            trackingNumber: input.trackingNumber ?? null,
            actorName: staff.name,
            at: now,
          },
        });
      }
      if (restock) await this.restock(tx, order.items as OrderItem[]);
      await this.audit.record(
        {
          actor: staff,
          action: "order.update",
          entity: "order",
          entityId: order.reference,
          before: { status: current, paymentVerified: order.paymentVerified },
          after: input,
        },
        tx,
      );
    });
    if (restock) {
      this.content.invalidate();
      this.revalidate.request(["products"]);
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
