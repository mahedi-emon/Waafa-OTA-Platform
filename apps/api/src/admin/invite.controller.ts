import { Body, Controller, HttpCode, Inject, Post, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { InviteAcceptInputSchema } from "@waafa/shared";
import { createRateLimiter } from "../common/rateLimit";
import { parseInput, problems } from "../common/problem";
import { clientIp } from "../common/serverKey";
import { ENV, type Env } from "../config/env";
import { AdminUsersService } from "./users.service";

// Like sign-in: a few tries per address, so invite links can't be guessed.
const allowAccept = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

/** The welcome page's one call (D0 R9): an invite link and a chosen password become a working sign-in. */
@Controller("auth/invite")
export class StaffInviteController {
  constructor(
    @Inject(AdminUsersService) private readonly users: AdminUsersService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post()
  @HttpCode(200)
  accept(@Body() body: unknown, @Req() request: FastifyRequest) {
    if (!allowAccept(`invite:${clientIp(request, this.env)}`))
      throw problems.tooMany("Too many tries. Wait 15 minutes.");
    const input = parseInput(InviteAcceptInputSchema, body);
    return this.users.acceptInvite(input.token, input.password);
  }
}
