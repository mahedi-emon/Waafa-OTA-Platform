import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { createIdempotencyStore, isIdempotencyKey } from "@/lib/leads/idempotency";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import type { IntakeContext } from "@/lib/data/api/apiClient";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";
import { intakeFailure } from "./intakeFailure";
import { isSameSite, readCappedBody } from "./readCappedBody";

type SubmissionOptions<Input, Output> = {
  /** Rate-limit bucket name, e.g. "feedback". */
  name: string;
  /** Requests per minute per client. */
  perMinute: number;
  maxBytes: number;
  /** Body field that carries the payload, e.g. "feedback" for `{ idempotencyKey, feedback }`. */
  field: string;
  schema: ZodType<Input>;
  run: (input: Input, context: IntakeContext) => Promise<Output>;
};

/**
 * POST handler for a public form (CLAUDE.md "Always"): same-site only, capped body, per-client rate limit, Turnstile
 * when configured, validated against the shared contract, and idempotent per key so a double tap stores one record.
 */
export function createSubmissionHandler<Input, Output>(options: SubmissionOptions<Input, Output>) {
  const allow = createRateLimiter({ limit: options.perMinute, windowMs: 60_000 });
  const once = createIdempotencyStore<Output>({ ttlMs: 10 * 60_000 });

  return async function POST(request: Request) {
    if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const ip = clientKey(request.headers);
    if (!allow(`${options.name}:${ip}`)) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429 });
    }
    const text = await readCappedBody(request, options.maxBytes);
    if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    if (!isIdempotencyKey(body.idempotencyKey)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const parsed = options.schema.safeParse(body[options.field]);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
        { status: 422 },
      );
    }
    const token = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;
    if (!(await verifyTurnstile(token, ip))) {
      return NextResponse.json({ error: "challenge" }, { status: 400 });
    }
    try {
      const key = body.idempotencyKey;
      const result = await once(key, () =>
        options.run(parsed.data, { clientIp: ip, idempotencyKey: key }),
      );
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      return intakeFailure(error);
    }
  };
}
