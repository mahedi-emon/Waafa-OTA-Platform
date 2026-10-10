import { Inject, Injectable } from "@nestjs/common";
import type { z } from "zod";
import {
  toDhakaIsoString,
  type FeedbackListQuerySchema,
  type FeedbackModerationInput,
  type PaymentProofListQuerySchema,
  type PaymentProofReviewInput,
  type SearchLogListQuerySchema,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
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
  ) {}

  async feedback(query: z.output<typeof FeedbackListQuerySchema>) {
    const where = query.status ? { status: query.status } : {};
    const [total, rows] = await Promise.all([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.findMany({ where, orderBy: { createdAt: "desc" }, ...window(query) }),
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
    await this.prisma.$transaction(async (tx) => {
      await tx.feedback.update({
        where: { id },
        data: { status: input.status, moderatedAt: now, moderatedBy: staff.name },
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
    return { id, status: input.status };
  }

  async proofs(query: z.output<typeof PaymentProofListQuerySchema>) {
    const where = query.status ? { status: query.status } : {};
    const [total, rows] = await Promise.all([
      this.prisma.paymentProof.count({ where }),
      this.prisma.paymentProof.findMany({
        where,
        orderBy: { createdAt: "desc" },
        ...window(query),
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => ({
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
        createdAt: toDhakaIsoString(row.createdAt),
      })),
    };
  }

  /** Verifying a proof for an order marks the order's payment verified, with a history entry. */
  async reviewProof(
    staff: StaffPrincipal,
    id: string,
    input: PaymentProofReviewInput,
    now = new Date(),
  ) {
    const proof = await this.prisma.paymentProof.findUnique({ where: { id } });
    if (!proof) throw problems.notFound("Payment proof not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentProof.update({
        where: { id },
        data: { status: input.status, note: input.note ?? proof.note },
      });
      if (input.status === "verified") {
        const order = await tx.order.findUnique({ where: { reference: proof.reference } });
        if (order && !order.paymentVerified) {
          await tx.order.update({ where: { id: order.id }, data: { paymentVerified: true } });
          await tx.orderEvent.create({
            data: {
              orderId: order.id,
              status: order.status,
              note: `Payment verified (${proof.transactionId ?? "slip"})`,
              actorName: staff.name,
              at: now,
            },
          });
        }
      }
      await this.audit.record(
        {
          actor: staff,
          action: "payment-proof.review",
          entity: "payment-proof",
          entityId: proof.reference,
          before: { status: proof.status },
          after: input,
        },
        tx,
      );
    });
    return { id, status: input.status };
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

  async subscribers(paging: Paging) {
    const where = { unsubscribedAt: null };
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

  async notifications(paging: Paging) {
    const [total, rows] = await Promise.all([
      this.prisma.notificationLog.count(),
      this.prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, ...window(paging) }),
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
