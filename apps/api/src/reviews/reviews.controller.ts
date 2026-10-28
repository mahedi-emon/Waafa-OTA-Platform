import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Module,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import {
  IdSchema,
  QuestionAnswerSchema,
  QuestionInputSchema,
  ReviewDecisionSchema,
  ReviewInputSchema,
  ReviewKindSchema,
} from "@waafa/shared";
import { Roles, Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { ENV, type Env } from "../config/env";
import { parseInput, problems } from "../common/problem";
import { RateLimitService } from "../common/rateLimit.service";
import { IntakeKeyGuard, clientIp } from "../common/serverKey";
import { ReviewsService } from "./reviews.service";

const SESSION_HEADER = "x-customer-session";
const sessionToken = (request: FastifyRequest) => {
  const value = request.headers[SESSION_HEADER];
  return typeof value === "string" ? value : undefined;
};
const EligibilitySchema = z.object({ kind: ReviewKindSchema, targetId: IdSchema }).strict();
const QueueSchema = z
  .object({
    status: z.enum(["pending", "approved", "rejected", "hidden", "all"]).default("pending"),
  })
  .strict();
const id = (value: string) => {
  if (!IdSchema.safeParse(value).success) throw problems.notFound();
  return value;
};

/** The site's side (issue 245), called by the web server with the intake key; reviews need the customer's session. */
@Controller("public")
@UseGuards(IntakeKeyGuard)
export class PublicReviewsController {
  constructor(
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get("reviews")
  list() {
    return this.reviews.publicList();
  }

  @Get("account/reviews/eligibility")
  eligibility(@Query() query: unknown, @Req() request: FastifyRequest) {
    const input = parseInput(EligibilitySchema, query);
    return this.reviews.eligibility(sessionToken(request), input.kind, input.targetId);
  }

  @Post("account/reviews")
  async submit(@Body() body: unknown, @Req() request: FastifyRequest) {
    if (!(await this.limits.allow("reviews", clientIp(request, this.env))))
      throw problems.tooMany();
    return this.reviews.submit(sessionToken(request), parseInput(ReviewInputSchema, body));
  }

  @Post("questions")
  async ask(@Body() body: unknown, @Req() request: FastifyRequest) {
    if (!(await this.limits.allow("questions", clientIp(request, this.env))))
      throw problems.tooMany();
    return this.reviews.ask(parseInput(QuestionInputSchema, body));
  }
}

/** Admin › Reviews and questions (issue 245): content editors, the store team and managers; audited. */
@Controller("admin/reviews")
@UseGuards(StaffGuard)
@Roles("content-editor", "shop-manager", "travel-sales")
export class AdminReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviews: ReviewsService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.reviews.adminList(parseInput(QueueSchema, query).status);
  }

  @Post(":id/decide")
  @HttpCode(200)
  decide(@Staff() staff: StaffPrincipal, @Param("id") reviewId: string, @Body() body: unknown) {
    return this.reviews.decide(staff, id(reviewId), parseInput(ReviewDecisionSchema, body));
  }

  @Post("questions/:id")
  @HttpCode(200)
  answer(@Staff() staff: StaffPrincipal, @Param("id") questionId: string, @Body() body: unknown) {
    return this.reviews.answer(staff, id(questionId), parseInput(QuestionAnswerSchema, body));
  }
}

@Module({
  controllers: [PublicReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
