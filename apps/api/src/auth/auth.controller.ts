import { Body, Controller, Get, HttpCode, Inject, Post, Req, UseGuards } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { DeviceIdSchema, TwoStepCodeSchema } from "@waafa/shared";
import { ENV, type Env } from "../config/env";
import { RateLimitService } from "../common/rateLimit.service";
import { clientIp } from "../common/serverKey";
import { parseInput, problems } from "../common/problem";
import { AuthService, type ClientMeta } from "./auth.service";
import { Staff, StaffGuard } from "./auth.guard";
import type { StaffPrincipal } from "./principal";
import { TwoStepService } from "./twoStep.service";

const LoginSchema = z
  .object({
    email: z.email().max(160),
    password: z.string().min(1).max(200),
    device: DeviceIdSchema.optional(),
  })
  .strict();
const ChallengeTokenSchema = z.string().min(20).max(2000);
const SecondStepSchema = z
  .object({
    challenge: ChallengeTokenSchema,
    code: TwoStepCodeSchema,
    device: DeviceIdSchema.optional(),
    trustDevice: z.boolean().optional(),
  })
  .strict();
const RefreshSchema = z.object({ refreshToken: z.string().min(20).max(200) }).strict();
const SetupConfirmSchema = z
  .object({ challenge: ChallengeTokenSchema, code: TwoStepCodeSchema })
  .strict();
const CodeOnlySchema = z.object({ code: TwoStepCodeSchema }).strict();
const PasswordOnlySchema = z.object({ password: z.string().min(1).max(200) }).strict();

/** The visitor as the web server reports it (x-client-ip with the intake key), for the history and the email. */
const meta = (request: FastifyRequest, env: Env, device?: string): ClientMeta => ({
  ip: clientIp(request, env),
  userAgent:
    typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : undefined,
  ...(device ? { device } : {}),
});

/**
 * Staff authentication for the admin (B2). The web admin calls these server to server and keeps the tokens in its
 * own httpOnly cookies, so the API never sets cookies and needs no CSRF token. Issue 234: the code and enrolment
 * steps, and two-step sign-in in My account.
 */
@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(TwoStepService) private readonly twoStep: TwoStepService,
    @Inject(RateLimitService) private readonly limits: RateLimitService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: FastifyRequest) {
    // PRD NFR-SEC: login 5 per 15 minutes per address (the account lockout is separate).
    if (!(await this.limits.allow("login", clientIp(request, this.env))))
      throw problems.tooMany("Too many sign-in attempts. Wait 15 minutes.");
    const input = parseInput(LoginSchema, body);
    return this.auth.login(input.email, input.password, meta(request, this.env, input.device));
  }

  @Post("login/code")
  @HttpCode(200)
  async code(@Body() body: unknown, @Req() request: FastifyRequest) {
    await this.limitCodes(request);
    const input = parseInput(SecondStepSchema, body);
    return this.auth.verifyCode(input.challenge, input.code, {
      ...meta(request, this.env, input.device),
      trustDevice: input.trustDevice ?? false,
    });
  }

  @Post("login/enrol")
  @HttpCode(200)
  async enrol(@Body() body: unknown, @Req() request: FastifyRequest) {
    await this.limitCodes(request);
    const input = parseInput(SecondStepSchema, body);
    return this.auth.enrol(input.challenge, input.code, {
      ...meta(request, this.env, input.device),
      trustDevice: input.trustDevice ?? false,
    });
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Body() body: unknown, @Req() request: FastifyRequest) {
    const input = parseInput(RefreshSchema, body);
    return this.auth.refresh(input.refreshToken, meta(request, this.env));
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

  // My account › Two-step sign-in and recent sign-ins ---------------------------------------------------------------

  @Get("two-step")
  @UseGuards(StaffGuard)
  status(@Staff() staff: StaffPrincipal) {
    return this.twoStep.status(staff);
  }

  @Post("two-step/start")
  @UseGuards(StaffGuard)
  @HttpCode(200)
  start(@Staff() staff: StaffPrincipal) {
    return this.twoStep.start(staff);
  }

  @Post("two-step/confirm")
  @UseGuards(StaffGuard)
  @HttpCode(200)
  async confirm(
    @Staff() staff: StaffPrincipal,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ) {
    await this.limitCodes(request);
    const input = parseInput(SetupConfirmSchema, body);
    return this.twoStep.confirm(staff, input.challenge, input.code);
  }

  @Post("two-step/recovery-codes")
  @UseGuards(StaffGuard)
  @HttpCode(200)
  async recoveryCodes(
    @Staff() staff: StaffPrincipal,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ) {
    await this.limitCodes(request);
    return this.twoStep.newRecoveryCodes(staff, parseInput(CodeOnlySchema, body).code);
  }

  @Post("two-step/off")
  @UseGuards(StaffGuard)
  @HttpCode(204)
  async off(@Staff() staff: StaffPrincipal, @Body() body: unknown, @Req() request: FastifyRequest) {
    await this.limitCodes(request);
    await this.twoStep.turnOff(staff, parseInput(PasswordOnlySchema, body).password);
  }

  @Get("logins")
  @UseGuards(StaffGuard)
  logins(@Staff() staff: StaffPrincipal) {
    return this.twoStep.history(staff.id);
  }

  private async limitCodes(request: FastifyRequest): Promise<void> {
    if (!(await this.limits.allow("loginCode", clientIp(request, this.env))))
      throw problems.tooMany("Too many tries. Wait 15 minutes.");
  }
}
