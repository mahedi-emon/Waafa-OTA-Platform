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
import { GoogleSignInInputSchema } from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { parseInput, problems } from "../common/problem";
import { createRateLimiter } from "../common/rateLimit";
import { IntakeKeyGuard, clientIp } from "../common/serverKey";
import { CustomersService } from "./customers.service";

/** Sign-ins and account calls per visitor address, a minute window (the web adds its own). */
const limits = {
  signIn: createRateLimiter({ limit: 10, windowMs: 60_000 }),
  account: createRateLimiter({ limit: 60, windowMs: 60_000 }),
};

/** The session token travels server to server in this header, never in a URL. */
const SESSION_HEADER = "x-customer-session";

function sessionToken(request: FastifyRequest): string | undefined {
  const value = request.headers[SESSION_HEADER];
  return typeof value === "string" ? value : undefined;
}

/**
 * Customer sign-in and My account (FR-ACC, issue 134), called by the web server with the intake key: the Google
 * configuration (client ID only), the code exchange, the account view, sign-out and deletion.
 */
@Controller("public")
@UseGuards(IntakeKeyGuard)
export class CustomersController {
  constructor(
    @Inject(CustomersService) private readonly customers: CustomersService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private limit(request: FastifyRequest, name: keyof typeof limits): void {
    if (!limits[name](`${name}:${clientIp(request, this.env)}`)) throw problems.tooMany();
  }

  @Get("auth/google/config")
  @Header("cache-control", "private, max-age=60")
  googleConfig() {
    return this.customers.googleConfig();
  }

  @Post("auth/google")
  @HttpCode(200)
  async signInWithGoogle(@Body() body: unknown, @Req() request: FastifyRequest) {
    this.limit(request, "signIn");
    const input = parseInput(GoogleSignInInputSchema, body);
    const agent = request.headers["user-agent"];
    return this.customers.signInWithGoogle(input, typeof agent === "string" ? agent : undefined);
  }

  @Get("account")
  @Header("cache-control", "no-store")
  async account(@Req() request: FastifyRequest) {
    this.limit(request, "account");
    return this.customers.account(sessionToken(request));
  }

  @Post("account/sign-out")
  @HttpCode(204)
  async signOut(@Req() request: FastifyRequest) {
    this.limit(request, "account");
    await this.customers.signOut(sessionToken(request));
  }

  @Post("account/delete")
  @HttpCode(204)
  async deleteAccount(@Req() request: FastifyRequest) {
    this.limit(request, "account");
    await this.customers.deleteAccount(sessionToken(request));
  }
}
