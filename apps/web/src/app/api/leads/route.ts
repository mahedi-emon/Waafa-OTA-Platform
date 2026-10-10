import { NextResponse } from "next/server";
import { LeadCreateInputSchema, type LeadCreated } from "@waafa/shared";
import { createLead } from "@/lib/data/leads";
import { intakeFailure } from "@/lib/http/intakeFailure";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { createIdempotencyStore, isIdempotencyKey } from "@/lib/leads/idempotency";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 16_384;
const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });
const once = createIdempotencyStore<LeadCreated>({ ttlMs: 10 * 60_000 });

/**
 * Lead intake for every module (FR-FLT-05, FR-HTL, FR-PKG, FR-VISA…): same-site only, 16 KB, 10 per minute per
 * client, Turnstile when configured, validated against the shared contract, and idempotent per key, so a double
 * tap makes one lead and returns the same reference.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`leads:${ip}`)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  const text = await readCappedBody(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });

  let body: { idempotencyKey?: unknown; turnstileToken?: unknown; lead?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!isIdempotencyKey(body.idempotencyKey)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = LeadCreateInputSchema.safeParse(body.lead);
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
    const created = await once(key, () =>
      createLead(parsed.data, { clientIp: ip, idempotencyKey: key }),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return intakeFailure(error);
  }
}
