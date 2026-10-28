import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  QuoteAcceptInputSchema,
  QuoteInputSchema,
  QuoteSendInputSchema,
  QuoteTokenSchema,
} from "@waafa/shared";
import { Staff, StaffGuard } from "../auth/auth.guard";
import type { StaffPrincipal } from "../auth/principal";
import { parseInput, problems } from "../common/problem";
import { RateLimitService, type RateBucket } from "../common/rateLimit.service";
import { IntakeKeyGuard, clientIp } from "../common/serverKey";
import { ENV, type Env } from "../config/env";
import { AdminQuotesService } from "./quotes.service";

const IdSchema = z.string().regex(/^[a-z0-9]{10,40}$/, "Unknown quote");
const LeadIdSchema = z.string().regex(/^[a-z0-9]{10,40}$/, "Unknown lead");

const sendPdf = (reply: FastifyReply, file: { name: string; pdf: Buffer }) =>
  reply
    .header("content-type", "application/pdf")
    .header("content-disposition", `inline; filename="${file.name}"`)
    .header("cache-control", "private, no-store")
    .header("x-content-type-options", "nosniff")
    .send(file.pdf);

/** Quotes on a lead (issue 298): whoever may open the lead writes, sends and withdraws its quotes. */
@Controller("admin")
@UseGuards(StaffGuard)
export class AdminQuotesController {
  constructor(@Inject(AdminQuotesService) private readonly quotes: AdminQuotesService) {}

  @Post("leads/:id/quotes")
  create(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    return this.quotes.create(
      staff,
      parseInput(LeadIdSchema, id),
      parseInput(QuoteInputSchema, body),
    );
  }

  @Get("quotes/:id")
  get(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.quotes.get(staff, parseInput(IdSchema, id));
  }

  @Patch("quotes/:id")
  update(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    return this.quotes.update(staff, parseInput(IdSchema, id), parseInput(QuoteInputSchema, body));
  }

  @Post("quotes/:id/send")
  @HttpCode(200)
  send(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Body() body: unknown) {
    return this.quotes.send(
      staff,
      parseInput(IdSchema, id),
      parseInput(QuoteSendInputSchema, body).channel,
    );
  }

  @Post("quotes/:id/withdraw")
  @HttpCode(200)
  withdraw(@Staff() staff: StaffPrincipal, @Param("id") id: string) {
    return this.quotes.withdraw(staff, parseInput(IdSchema, id));
  }

  @Get("quotes/:id/pdf")
  async pdf(@Staff() staff: StaffPrincipal, @Param("id") id: string, @Res() reply: FastifyReply) {
    return sendPdf(reply, await this.quotes.pdfForStaff(staff, parseInput(IdSchema, id)));
  }
}

/**
 * The customer's quote (issue 298), called by the web server with the intake key: the page, the PDF and Accept, by
 * the signed link. The web checks same-site, Turnstile and its own limit before Accept; these limits sit behind it.
 */
@Controller("public/quotes")
@UseGuards(IntakeKeyGuard)
export class PublicQuotesController {
  constructor(
    @Inject(AdminQuotesService) private readonly quotes: AdminQuotesService,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private async limit(request: FastifyRequest, name: RateBucket): Promise<void> {
    if (!(await this.limits.allow(name, clientIp(request, this.env)))) throw problems.tooMany();
  }

  @Post("accept")
  @HttpCode(200)
  async accept(@Body() body: unknown, @Req() request: FastifyRequest) {
    await this.limit(request, "quoteAccept");
    const input = parseInput(QuoteAcceptInputSchema, body);
    return this.quotes.accept(input.token, input.optionId);
  }

  @Get(":token")
  async get(@Param("token") token: string, @Req() request: FastifyRequest) {
    await this.limit(request, "quotes");
    return this.quotes.forCustomer(parseInput(QuoteTokenSchema, token));
  }

  @Get(":token/pdf")
  async pdf(
    @Param("token") token: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    await this.limit(request, "quotes");
    return sendPdf(reply, await this.quotes.pdfForCustomer(parseInput(QuoteTokenSchema, token)));
  }
}
