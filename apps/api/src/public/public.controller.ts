import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  FeedbackCreateInputSchema,
  LeadCreateInputSchema,
  OrderCreateInputSchema,
  OrderTrackInputSchema,
  PaymentProofInputSchema,
  SearchLogInputSchema,
  SubscriberInputSchema,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { IdempotencyService, type Replayable } from "../common/idempotency.service";
import { parseInput, problems } from "../common/problem";
import { createRateLimiter } from "../common/rateLimit";
import { IntakeKeyGuard, clientIp } from "../common/serverKey";
import { ContentService } from "../content/content.service";
import { IntakeService } from "./intake.service";

const IdempotencyKeySchema = z.uuid();

/*
 * Per-visitor limits behind the web's own (PRD NFR-SEC): the web limits first, these catch anything that reaches the
 * API another way. Twice the web's numbers, so the two layers never disagree for a real visitor.
 */
const limits = {
  leads: createRateLimiter({ limit: 20, windowMs: 60_000 }),
  orders: createRateLimiter({ limit: 12, windowMs: 60_000 }),
  track: createRateLimiter({ limit: 30, windowMs: 60_000 }),
  feedback: createRateLimiter({ limit: 10, windowMs: 60_000 }),
  proofs: createRateLimiter({ limit: 10, windowMs: 60_000 }),
  searchLogs: createRateLimiter({ limit: 60, windowMs: 60_000 }),
  subscribers: createRateLimiter({ limit: 10, windowMs: 60_000 }),
};

/**
 * What the public site reads and submits (B3), called by the web server with the intake key: the content snapshot
 * (ETag), leads for every module, orders priced on the server, order tracking, feedback, payment proofs, search logs
 * and newsletter sign-ups. Writes that create a record need an Idempotency-Key header.
 */
@Controller("public")
@UseGuards(IntakeKeyGuard)
export class PublicController {
  constructor(
    @Inject(IntakeService) private readonly intake: IntakeService,
    @Inject(ContentService) private readonly content: ContentService,
    @Inject(IdempotencyService) private readonly idempotency: IdempotencyService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private limit(request: FastifyRequest, name: keyof typeof limits): void {
    if (!limits[name](`${name}:${clientIp(request, this.env)}`)) throw problems.tooMany();
  }

  private idempotencyKey(request: FastifyRequest): string {
    const parsed = IdempotencyKeySchema.safeParse(request.headers["idempotency-key"]);
    if (!parsed.success) {
      throw problems.badRequest("Send an Idempotency-Key header with a UUID", "idempotency-key");
    }
    return parsed.data;
  }

  private send(reply: FastifyReply, outcome: Replayable<unknown>) {
    if (outcome.replayed) void reply.header("idempotent-replayed", "true");
    if (outcome.status >= 400) void reply.header("content-type", "application/problem+json");
    return reply.status(outcome.status).send(outcome.body);
  }

  @Get("snapshot")
  async snapshot(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const snapshot = await this.content.snapshot();
    void reply.header("etag", snapshot.etag).header("cache-control", "private, no-cache");
    if (request.headers["if-none-match"] === snapshot.etag) return reply.status(304).send();
    return reply.status(200).send(snapshot.body);
  }

  @Post("leads")
  async createLead(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    this.limit(request, "leads");
    const key = this.idempotencyKey(request);
    const input = parseInput(LeadCreateInputSchema, body);
    const outcome = await this.idempotency.once(key, "lead", async () => ({
      status: 201,
      body: await this.intake.createLead(input),
    }));
    return this.send(reply, outcome);
  }

  @Post("orders")
  async placeOrder(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    this.limit(request, "orders");
    const key = this.idempotencyKey(request);
    const input = parseInput(OrderCreateInputSchema, body);
    const outcome = await this.idempotency.once<unknown>(key, "order", async () => {
      const result = await this.intake.placeOrder(input);
      if (result.ok) return { status: 201, body: result.order };
      return {
        status: 409,
        body: {
          type: "about:blank",
          status: 409,
          title: "Order not placed",
          code: result.reason,
          ...(result.quote ? { quote: result.quote } : {}),
          instance: request.url,
          requestId: request.id,
        },
      };
    });
    return this.send(reply, outcome);
  }

  @Post("orders/track")
  @HttpCode(200)
  async trackOrder(@Body() body: unknown, @Req() request: FastifyRequest) {
    this.limit(request, "track");
    const input = parseInput(OrderTrackInputSchema, body);
    const order = await this.intake.trackOrder(input.reference, input.phone);
    if (!order) throw problems.notFound("No order with this number and phone");
    return order;
  }

  @Post("feedback")
  async createFeedback(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    this.limit(request, "feedback");
    const key = this.idempotencyKey(request);
    const input = parseInput(FeedbackCreateInputSchema, body);
    const outcome = await this.idempotency.once(key, "feedback", async () => ({
      status: 201,
      body: await this.intake.createFeedback(input),
    }));
    return this.send(reply, outcome);
  }

  @Post("payment-proofs")
  async createPaymentProof(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    this.limit(request, "proofs");
    const key = this.idempotencyKey(request);
    const input = parseInput(PaymentProofInputSchema, body);
    const outcome = await this.idempotency.once(key, "payment-proof", async () => ({
      status: 201,
      body: await this.intake.createPaymentProof(input),
    }));
    return this.send(reply, outcome);
  }

  @Post("search-logs")
  async logSearch(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    this.limit(request, "searchLogs");
    await this.intake.logSearch(parseInput(SearchLogInputSchema, body));
    return reply.status(204).send();
  }

  @Post("subscribers")
  async subscribe(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    this.limit(request, "subscribers");
    const input = parseInput(SubscriberInputSchema, body);
    await this.intake.subscribe(input.email, input.source);
    return reply.status(204).send();
  }
}
