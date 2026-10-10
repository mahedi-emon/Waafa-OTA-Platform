import { Body, Controller, Get, HttpCode, Inject, Post, Req, UseGuards } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { ENV, type Env } from "../config/env";
import { createRateLimiter } from "../common/rateLimit";
import { clientIp } from "../common/serverKey";
import { parseInput, problems } from "../common/problem";
import { AuthService } from "./auth.service";
import { Staff, StaffGuard } from "./auth.guard";
import type { StaffPrincipal } from "./principal";

const LoginSchema = z
  .object({ email: z.email().max(160), password: z.string().min(1).max(200) })
  .strict();
const RefreshSchema = z.object({ refreshToken: z.string().min(20).max(200) }).strict();

// PRD NFR-SEC: login 5 per 15 minutes per address (the account lockout is separate).
const allowLogin = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

const meta = (request: FastifyRequest) => ({
  ip: request.ip,
  userAgent:
    typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
});

/**
 * Staff authentication for the admin (B2). The web admin calls these server to server and keeps the tokens in its
 * own httpOnly cookies, so the API never sets cookies and needs no CSRF token.
 */
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: FastifyRequest) {
    if (!allowLogin(`login:${clientIp(request, this.env)}`))
      throw problems.tooMany("Too many sign-in attempts. Wait 15 minutes.");
    const input = parseInput(LoginSchema, body);
    return this.auth.login(input.email, input.password, meta(request));
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Body() body: unknown, @Req() request: FastifyRequest) {
    const input = parseInput(RefreshSchema, body);
    return this.auth.refresh(input.refreshToken, meta(request));
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Body() body: unknown) {
    const input = parseInput(RefreshSchema, body);
    await this.auth.logout(input.refreshToken);
  }

  @Get("me")
  @UseGuards(StaffGuard)
  me(@Staff() staff: StaffPrincipal) {
    return { id: staff.id, name: staff.name, email: staff.email, roles: staff.roles };
  }
}
