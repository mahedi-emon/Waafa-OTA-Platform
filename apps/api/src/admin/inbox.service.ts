import { readFile } from "node:fs/promises";
import path from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import type { z } from "zod";
import {
  formatTaka,
  nextProofStatus,
  toDhakaIsoString,
  type FeedbackListQuerySchema,
  type FeedbackModerationInput,
  type PaymentProofActionInput,
  type PaymentProofListQuerySchema,
  type SearchLogListQuerySchema,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { NotificationService } from "../notifications/notification.service";
import { PrismaService } from "../prisma/prisma.service";
import { MediaService } from "../media/media.service";
import { ENV, type Env } from "../config/env";
import { RevalidateService } from "../revalidate/revalidate.service";
import { dhakaDate } from "./access";

type Paging = { page: number; pageSize: number };
const window = (paging: Paging) => ({
  skip: (paging.page - 1) * paging.pageSize,
  take: paging.pageSize,
});

/**
 * The admin's queues: feedback moderation, offline payment proofs (Accounts), search activity, newsletter
 * subscribers and the email log.
 */
@Injectable()
export class AdminInboxService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
    @Inject(NotificationService) private readonly notifier: NotificationService,
    @Inject(MediaService) private readonly media: MediaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * An approved feedback's photo goes public (issue 245): the private upload, once its malware scan passed (or when no
   * scanner is set up), is optimised into the media library and the feedback points at that copy. Anything else
   * (not scanned yet, a hit, not a photo) approves the words alone and says why.
   */
  private async publishPhoto(
    staff: StaffPrincipal,
    item: { id: string; name: string; photo: unknown },
  ): Promise<{ photo: Record<string, unknown> | null; note: string | null }> {
    const ref = item.photo as { storageKey?: unknown; src?: unknown } | null;
    if (!ref) return { photo: null, note: null };
    if (typeof ref.src === "string") return { photo: ref as Record<string, unknown>, note: null };
    if (typeof ref.storageKey !== "string") return { photo: null, note: null };
    const file = await this.prisma.customerFile.findUnique({
      where: { storageKey: ref.storageKey },
    });
    if (!file) return { photo: null, note: "photo-missing" };
    const scanned =
      file.scanStatus === "clean" || (!this.env.CLAMAV_URL && file.scanStatus === "unscanned");
    if (!scanned) return { photo: null, note: "photo-not-scanned" };
    try {
      const bytes = await readFile(path.join(path.resolve(this.env.PRIVATE_FILES_DIR), file.path));
      const saved = await this.media.upload(staff, bytes, file.mimeType, {
        alt: `Photo shared by ${item.name}`,
        credit: item.name,
      });
      return {
        photo: {
          src: saved.url,
          alt: saved.alt,
          width: saved.width,
          height: saved.height,
          credit: item.name,
        },
        note: null,
      };
    } catch {
      return { photo: null, note: "photo-not-image" };
    }
  }

  async feedback(query: z.output<typeof FeedbackListQuerySchema>) {
    const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });
    const where: Prisma.FeedbackWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: contains(query.q) },
              { phone: contains(query.q) },
              { comment: contains(query.q) },
              { reference: contains(query.q) },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: query.sort === "created.asc" ? "asc" : "desc" },
        ...window(query),
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        service: row.service,
        reference: row.reference,
        rating: row.rating,
        comment: row.comment,
        photo: row.photo,
        consentToPublish: row.consentToPublish,
        status: row.status,
        moderatedBy: row.moderatedBy,
        moderatedAt: row.moderatedAt ? toDhakaIsoString(row.moderatedAt) : null,
        createdAt: toDhakaIsoString(row.createdAt),
      })),
    };
  }

  async moderateFeedback(
    staff: StaffPrincipal,
    id: string,
    input: FeedbackModerationInput,
    now = new Date(),
  ) {
    const item = await this.prisma.feedback.findUnique({ where: { id } });
    if (!item) throw problems.notFound("Feedback not found");
    if (input.status === "approved" && !item.consentToPublish) {
      throw problems.conflict("The customer did not agree to publish this feedback", "no-consent");
    }
    // Issue 245: on approval a clean photo becomes public; a rejected one stays private.
    const published =
      input.status === "approved"
        ? await this.publishPhoto(staff, item)
        : { photo: null, note: null };
    await this.prisma.$transaction(async (tx) => {
      await tx.feedback.update({
        where: { id },
        data: {
          status: input.status,
          moderatedAt: now,
          moderatedBy: staff.name,
          ...(published.photo ? { photo: published.photo as Prisma.InputJsonValue } : {}),
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "feedback.moderate",
          entity: "feedback",
          entityId: id,
          before: { status: item.status },
          after: input,
        },
        tx,
      );
    });
    this.content.invalidate();
    this.revalidate.request(["feedback"]);
    return { id, status: input.status, ...(published.note ? { photoNote: published.note } : {}) };
  }

  /** Payment proofs by status; "received" is the To verify queue: received and matched proofs (D0 R4). */
  async proofs(query: z.output<typeof PaymentProofListQuerySchema>) {
    const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });
    const where: Prisma.PaymentProofWhereInput = {
      ...(query.status === "received"
        ? { status: { in: ["received", "matched"] } }
        : query.status
          ? { status: query.status }
          : {}),
      ...(query.q
        ? {
            OR: [
              { reference: contains(query.q) },
              { name: contains(query.q) },
              { phone: contains(query.q) },
              { transactionId: contains(query.q) },
            ],
          }
        : {}),
    };
    const [field, dir] = (query.sort?.split(".") ?? []) as [
      "created" | "amount" | undefined,
      "asc" | "desc" | undefined,
    ];
    const [total, rows] = await Promise.all([
      this.prisma.paymentProof.count({ where }),
      this.prisma.paymentProof.findMany({
        where,
        orderBy:
          field && dir
            ? [field === "amount" ? { amount: dir } : { createdAt: dir }, { id: "asc" }]
            : [{ status: "asc" }, { createdAt: "desc" }],
        ...window(query),
      }),
    ]);
    const orderIds = [...new Set(rows.flatMap((row) => (row.orderId ? [row.orderId] : [])))];
    const orders = new Map(
      (
        await this.prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, reference: true, total: true, status: true },
        })
      ).map((order) => [order.id, order]),
    );
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => {
        const order = row.orderId ? orders.get(row.orderId) : undefined;
        return {
          id: row.id,
          reference: row.reference,
          name: row.name,
          phone: row.phone,
          amount: row.amount,
          accountId: row.accountId,
          transactionId: row.transactionId,
          proof: row.proof,
          status: row.status,
          note: row.note,
          order: order
            ? { id: order.id, reference: order.reference, total: order.total, status: order.status }
            : null,
          decidedBy: row.decidedBy,
          decidedAt: row.decidedAt ? toDhakaIsoString(row.decidedAt) : null,
          createdAt: toDhakaIsoString(row.createdAt),
        };
      }),
    };
  }

  /** Verifying a proof for an order marks the order's payment verified, with a history entry. */
  /**
   * Verify or Reject a payment proof (D0 R4, ADMIN.md §8.5). Verify marks the order paid and confirms a placed one;
   * Reject keeps the reason and emails the customer when the order has an address. A decided proof stays decided.
   */
  async actOnProof(
    staff: StaffPrincipal,
    id: string,
    input: PaymentProofActionInput,
    now = new Date(),
  ) {
    const proof = await this.prisma.paymentProof.findUnique({ where: { id } });
    if (!proof) throw problems.notFound("Payment proof not found");
    const move = nextProofStatus(proof.status, input);
    if (!move.ok)
      throw problems.conflict(
        move.reason === "decided"
          ? "This payment proof is already decided"
          : "Say why in a few words",
        move.reason,
      );
    const order = proof.orderId
      ? await this.prisma.order.findUnique({ where: { id: proof.orderId } })
      : await this.prisma.order.findUnique({
          where: { reference: proof.reference.trim().toUpperCase() },
        });
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { id },
        data: {
          status: move.status,
          note: input.type === "reject" ? input.reason : proof.note,
          decidedAt: now,
          decidedBy: staff.name,
          ...(order ? { orderId: order.id } : {}),
        },
      });
      if (input.type === "verify" && order && !order.paymentVerified) {
        const confirm = order.status === "placed";
        await tx.order.update({
          where: { id: order.id },
          data: { paymentVerified: true, ...(confirm ? { status: "confirmed" } : {}) },
        });
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            status: confirm ? "confirmed" : order.status,
            note: `Payment verified (${proof.transactionId ?? "slip"})${confirm ? ", order confirmed" : ""}`,
            actorName: staff.name,
            at: now,
          },
        });
      }
      await this.audit.record(
        {
          actor: staff,
          action: `payment-proof.${input.type}`,
          entity: "payment-proof",
          entityId: proof.reference,
          before: { status: proof.status },
          after: { status: move.status },
          ...(input.type === "reject" ? { reason: input.reason } : {}),
        },
        tx,
      );
    });
    if (input.type === "reject") {
      void this.notifier.notify("payment-proof-rejected-customer", order?.email ?? undefined, {
        name: proof.name,
        reference: proof.reference,
        amount: formatTaka(proof.amount),
        reason: input.reason,
      });
    }
    return { id, status: move.status };
  }

  async searchLogs(query: z.output<typeof SearchLogListQuerySchema>) {
    const createdAt =
      query.from || query.to
        ? {
            ...(query.from ? { gte: dhakaDate(query.from) } : {}),
            ...(query.to ? { lt: dhakaDate(query.to, true) } : {}),
          }
        : undefined;
    const where: Prisma.SearchLogWhereInput = {
      ...(query.module ? { module: query.module } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(query.q ? { summary: { contains: query.q, mode: "insensitive" as const } } : {}),
    };
    const [total, rows, top, leads] = await Promise.all([
      this.prisma.searchLog.count({ where }),
      this.prisma.searchLog.findMany({ where, orderBy: { createdAt: "desc" }, ...window(query) }),
      this.prisma.searchLog.groupBy({
        by: ["module", "summary"],
        where,
        _count: { _all: true },
        orderBy: { _count: { summary: "desc" } },
        take: 10,
      }),
      this.prisma.lead.count({
        where: {
          module: query.module ?? { in: ["flights", "hotels", "packages", "visa"] },
          ...(createdAt ? { createdAt } : {}),
        },
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      leads,
      searchToLeadRate: total > 0 ? Math.round((leads / total) * 1000) / 10 : 0,
      topRoutes: top.map((row) => ({
        module: row.module,
        summary: row.summary,
        count: row._count._all,
      })),
      items: rows.map((row) => ({
        id: row.id,
        module: row.module,
        summary: row.summary,
        params: row.params,
        device: row.device,
        source: row.source,
        converted: Boolean(row.convertedLeadId),
        createdAt: toDhakaIsoString(row.createdAt),
      })),
    };
  }

  async subscribers(paging: Paging & { q?: string | undefined }) {
    const where: Prisma.SubscriberWhereInput = {
      unsubscribedAt: null,
      ...(paging.q ? { email: { contains: paging.q, mode: "insensitive" } } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.subscriber.count({ where }),
      this.prisma.subscriber.findMany({ where, orderBy: { createdAt: "desc" }, ...window(paging) }),
    ]);
    return {
      total,
      page: paging.page,
      pageSize: paging.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        source: row.source,
        createdAt: toDhakaIsoString(row.createdAt),
      })),
    };
  }

  async unsubscribe(staff: StaffPrincipal, id: string, now = new Date()) {
    const row = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!row) throw problems.notFound("Subscriber not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.subscriber.update({ where: { id }, data: { unsubscribedAt: now } });
      await this.audit.record(
        { actor: staff, action: "subscriber.remove", entity: "subscriber", entityId: row.email },
        tx,
      );
    });
  }

  async notifications(paging: Paging & { q?: string | undefined }) {
    const where: Prisma.NotificationLogWhereInput = paging.q
      ? {
          OR: [
            { recipient: { contains: paging.q, mode: "insensitive" } },
            { subject: { contains: paging.q, mode: "insensitive" } },
          ],
        }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...window(paging),
      }),
    ]);
    return {
      total,
      page: paging.page,
      pageSize: paging.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        channel: row.channel,
        recipient: row.recipient,
        template: row.template,
        subject: row.subject,
        status: row.status,
        error: row.error,
        attempts: row.attempts,
        createdAt: toDhakaIsoString(row.createdAt),
        sentAt: row.sentAt ? toDhakaIsoString(row.sentAt) : null,
      })),
    };
  }
}
