import { Inject, Injectable } from "@nestjs/common";
import {
  reviewerName,
  toDhakaIsoString,
  type PublicReviews,
  type QuestionAnswer,
  type QuestionInput,
  type ReviewDecision,
  type ReviewInput,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { problems } from "../common/problem";
import { ContentService } from "../content/content.service";
import { sessionFor } from "../customers/customerAuth";
import { PrismaService } from "../prisma/prisma.service";
import { RevalidateService } from "../revalidate/revalidate.service";

/** The web's cache tag for reviews and answered questions. */
export const REVIEWS_TAG = "reviews";

/**
 * Reviews and product questions (issue 245). A review comes only from a signed-in customer with a booked request for
 * that package or a delivered order with that product, so no review can be invented; staff approve, reject or reply.
 * Questions come from any visitor and show only once staff answer them. The site reads both through one cached call.
 */
@Injectable()
export class ReviewsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
  ) {}

  /** The booked lead or delivered order that lets this customer review the item, or null. */
  private async proofFor(customerId: string, kind: "package" | "product", targetId: string) {
    if (kind === "package") {
      const leads = await this.prisma.lead.findMany({
        where: { customerId, module: "packages", status: "booked" },
        select: { reference: true, payload: true },
      });
      return (
        leads.find((lead) => (lead.payload as { packageId?: unknown }).packageId === targetId)
          ?.reference ?? null
      );
    }
    const orders = await this.prisma.order.findMany({
      where: { customerId, status: "delivered" },
      select: { reference: true, items: true },
    });
    return (
      orders.find((order) =>
        (order.items as Array<{ productId?: unknown }>).some((item) => item.productId === targetId),
      )?.reference ?? null
    );
  }

  /** Whether the signed-in customer may review the item, and whether they already did. */
  async eligibility(token: string | undefined, kind: "package" | "product", targetId: string) {
    const found = await sessionFor(this.prisma, token);
    if (!found) return { signedIn: false, eligible: false, reviewed: false };
    const [proof, existing] = await Promise.all([
      this.proofFor(found.customer.id, kind, targetId),
      this.prisma.review.findUnique({
        where: { kind_targetId_customerId: { kind, targetId, customerId: found.customer.id } },
        select: { id: true },
      }),
    ]);
    return { signedIn: true, eligible: proof !== null, reviewed: existing !== null };
  }

  async submit(token: string | undefined, input: ReviewInput) {
    const found = await sessionFor(this.prisma, token);
    if (!found) throw problems.unauthorized("Sign in to write a review");
    const proof = await this.proofFor(found.customer.id, input.kind, input.targetId);
    if (!proof)
      throw problems.forbidden(
        input.kind === "package"
          ? "Reviews come from travellers who booked this package with us"
          : "Reviews come from customers who received this product",
      );
    const existing = await this.prisma.review.findUnique({
      where: {
        kind_targetId_customerId: {
          kind: input.kind,
          targetId: input.targetId,
          customerId: found.customer.id,
        },
      },
    });
    if (existing) throw problems.conflict("You reviewed this already", "reviewed");
    await this.prisma.review.create({
      data: {
        kind: input.kind,
        targetId: input.targetId,
        customerId: found.customer.id,
        proof,
        name: found.customer.name,
        rating: input.rating,
        title: input.title || null,
        body: input.body,
      },
    });
    return { status: "pending" as const };
  }

  async ask(input: QuestionInput) {
    const products = await this.content.collection("products");
    if (!products.some((product) => product.id === input.productId))
      throw problems.notFound("Product not found");
    await this.prisma.productQuestion.create({
      data: { productId: input.productId, name: input.name, question: input.question },
    });
    return { status: "pending" as const };
  }

  /** What the site shows: approved reviews and answered questions, newest first. */
  async publicList(): Promise<PublicReviews> {
    const [reviews, questions] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      this.prisma.productQuestion.findMany({
        where: { status: "published", answer: { not: null } },
        orderBy: { answeredAt: "desc" },
        take: 2000,
      }),
    ]);
    return {
      reviews: reviews.map((row) => ({
        id: row.id,
        kind: row.kind as "package" | "product",
        targetId: row.targetId,
        name: reviewerName(row.name),
        rating: row.rating,
        ...(row.title ? { title: row.title } : {}),
        body: row.body,
        ...(row.reply ? { reply: row.reply } : {}),
        createdAt: toDhakaIsoString(row.createdAt),
      })),
      questions: questions.map((row) => ({
        id: row.id,
        productId: row.productId,
        name: reviewerName(row.name),
        question: row.question,
        answer: row.answer ?? "",
        answeredAt: toDhakaIsoString(row.answeredAt ?? row.createdAt),
      })),
    };
  }

  /** The moderation queues for Admin, newest first. */
  async adminList(status: string) {
    const [reviews, questions] = await Promise.all([
      this.prisma.review.findMany({
        where: status === "all" ? {} : { status },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      this.prisma.productQuestion.findMany({
        where: status === "all" ? {} : { status: status === "approved" ? "published" : status },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);
    return {
      reviews: reviews.map((row) => ({
        id: row.id,
        kind: row.kind,
        targetId: row.targetId,
        name: row.name,
        proof: row.proof,
        rating: row.rating,
        title: row.title,
        body: row.body,
        status: row.status,
        reply: row.reply,
        createdAt: toDhakaIsoString(row.createdAt),
      })),
      questions: questions.map((row) => ({
        id: row.id,
        productId: row.productId,
        name: row.name,
        question: row.question,
        answer: row.answer,
        status: row.status,
        createdAt: toDhakaIsoString(row.createdAt),
      })),
    };
  }

  async decide(staff: StaffPrincipal, id: string, input: ReviewDecision) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw problems.notFound("Review not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id },
        data: {
          status: input.status,
          reply: input.reply ?? review.reply,
          decidedAt: new Date(),
          decidedBy: staff.name,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "review.moderate",
          entity: "review",
          entityId: id,
          before: { status: review.status },
          after: input,
        },
        tx,
      );
    });
    this.revalidate.request([REVIEWS_TAG]);
    return { id, status: input.status };
  }

  async answer(staff: StaffPrincipal, id: string, input: QuestionAnswer) {
    const question = await this.prisma.productQuestion.findUnique({ where: { id } });
    if (!question) throw problems.notFound("Question not found");
    await this.prisma.$transaction(async (tx) => {
      await tx.productQuestion.update({
        where: { id },
        data: {
          status: input.status,
          ...(input.answer
            ? { answer: input.answer, answeredBy: staff.name, answeredAt: new Date() }
            : {}),
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "question.answer",
          entity: "question",
          entityId: id,
          before: { status: question.status },
          after: input,
        },
        tx,
      );
    });
    this.revalidate.request([REVIEWS_TAG]);
    return { id, status: input.status };
  }

  /** Waiting counts for the sidebar and the bell. */
  async waiting() {
    const [reviews, questions] = await Promise.all([
      this.prisma.review.count({ where: { status: "pending" } }),
      this.prisma.productQuestion.count({ where: { status: "pending" } }),
    ]);
    return { reviews, questions };
  }
}
