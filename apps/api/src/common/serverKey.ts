import { createHash, timingSafeEqual } from "node:crypto";
import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ENV, type Env } from "../config/env";
import { problems } from "./problem";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time comparison of a presented secret with the expected one (hashing first hides the length). */
export function sameSecret(given: unknown, expected: string): boolean {
  return typeof given === "string" && timingSafeEqual(digest(given), digest(expected));
}

/** True when the request comes from the web server (it carries the shared intake key). */
export function fromWebServer(request: FastifyRequest, env: Env): boolean {
  return sameSecret(request.headers["x-intake-key"], env.INTAKE_KEY);
}

/**
 * The visitor's address for rate limits: the web passes it in x-client-ip, which is trusted only together with the
 * intake key; any other caller is limited by its own address.
 */
export function clientIp(request: FastifyRequest, env: Env): string {
  const forwarded = request.headers["x-client-ip"];
  return fromWebServer(request, env) && typeof forwarded === "string" && forwarded
    ? forwarded.slice(0, 64)
    : request.ip;
}

/**
 * The public intake endpoints serve the web server only (the site's own route handlers check same-site, Turnstile
 * and the visitor's rate limit first), so they need the intake key.
 */
@Injectable()
export class IntakeKeyGuard implements CanActivate {
  constructor(@Inject(ENV) private readonly env: Env) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!fromWebServer(request, this.env))
      throw problems.unauthorized("Missing or wrong intake key");
    return true;
  }
}
