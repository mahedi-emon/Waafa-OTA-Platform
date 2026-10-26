import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import {
  EmailCodeRequestSchema,
  EmailCodeVerifySchema,
  GoogleSignInInputSchema,
  SignUpCompleteSchema,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { parseInput, problems } from "../common/problem";
import { RateLimitService } from "../common/rateLimit.service";
import { IntakeKeyGuard, clientIp } from "../common/serverKey";
import { CustomerCodesService } from "./customerCodes.service";
import { CustomersService } from "./customers.service";

/** The session token travels server to server in this header, never in a URL. */
const SESSION_HEADER = "x-customer-session";

function userAgentOf(request: FastifyRequest): string | undefined {
  const agent = request.headers["user-agent"];
  return typeof agent === "string" ? agent : undefined;
}

function sessionToken(request: FastifyRequest): string | undefined {
  const value = request.headers[SESSION_HEADER];
  return typeof value === "string" ? value : undefined;
}

/**
 * Customer sign-in and My account (FR-ACC, issue 134), called by the web server with the intake key: the Google
 * configuration (client ID only), the code exchange, the account view, sign-out and deletion; and the email code
 * sign-in and sign-up (issue 241, D301).
 */
@Controller("public")
@UseGuards(IntakeKeyGuard)
export class CustomersController {
  constructor(
    @Inject(CustomersService) private readonly customers: CustomersService,
    @Inject(CustomerCodesService) private readonly codes: CustomerCodesService,
    @Inject(ENV) private readonly env: Env,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
  ) {}

  /** Sign-ins and account calls per visitor address, a minute window (the web adds its own). */
  private async limit(request: FastifyRequest, name: "signIn" | "account"): Promise<void> {
    const bucket = name === "signIn" ? "customerSignIn" : "customerAccount";
    if (!(await this.limits.allow(bucket, clientIp(request, this.env)))) throw problems.tooMany();
  }

  @Get("auth/google/config")
  @Header("cache-control", "private, max-age=60")
  googleConfig() {
    return this.customers.googleConfig();
  }

  @Post("auth/google")
  @HttpCode(200)
  async signInWithGoogle(@Body() body: unknown, @Req() request: FastifyRequest) {
    await this.limit(request, "signIn");
    const input = parseInput(GoogleSignInInputSchema, body);
    const agent = request.headers["user-agent"];
    return this.customers.signInWithGoogle(input, typeof agent === "string" ? agent : undefined);
  }

  /** Sends a sign-in code. The same 202 for every address (no enumeration); only the limits answer 429. */
  @Post("auth/email/code")
  @HttpCode(202)
  async requestCode(@Body() body: unknown, @Req() request: FastifyRequest) {
    const { email } = parseInput(EmailCodeRequestSchema, body);
    await this.codes.requestCode(email, clientIp(request, this.env));
    return {};
  }

  /** Checks a code: a session for an account, or a sign-up ticket for a new address. */
  @Post("auth/email/verify")
  @HttpCode(200)
  async verifyCode(@Body() body: unknown, @Req() request: FastifyRequest) {
    const { email, code } = parseInput(EmailCodeVerifySchema, body);
    return this.codes.verifyCode(email, code, clientIp(request, this.env), userAgentOf(request));
  }

  /** Finishes sign-up with a name and a phone (a contact field, not verified). */
  @Post("auth/email/complete")
  @HttpCode(200)
  async completeSignUp(@Body() body: unknown, @Req() request: FastifyRequest) {
    await this.limit(request, "signIn");
    return this.codes.completeSignUp(parseInput(SignUpCompleteSchema, body), userAgentOf(request));
  }

  @Get("account")
  @Header("cache-control", "no-store")
  async account(@Req() request: FastifyRequest) {
    await this.limit(request, "account");
    return this.customers.account(sessionToken(request));
  }

  @Post("account/sign-out")
  @HttpCode(204)
  async signOut(@Req() request: FastifyRequest) {
    await this.limit(request, "account");
    await this.customers.signOut(sessionToken(request));
  }

  @Post("account/delete")
  @HttpCode(204)
  async deleteAccount(@Req() request: FastifyRequest) {
    await this.limit(request, "account");
    await this.customers.deleteAccount(sessionToken(request));
  }
}
