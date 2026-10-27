import { NextResponse } from "next/server";
import { EmailCodeRequestSchema } from "@waafa/shared";
import { requestEmailCode } from "@/lib/account/accountApi";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { createIdempotencyStore, isIdempotencyKey } from "@/lib/leads/idempotency";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });
const once = createIdempotencyStore<Awaited<ReturnType<typeof requestEmailCode>>>({
  ttlMs: 10 * 60_000,
});

/**
 * Emails a sign-in code (issue 241, D301): same-site only, capped body, a per-visitor limit, Turnstile when set, and
 * idempotent per key so a double tap sends one email. The answer never says whether the address has an account.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`code:${ip}`)) return NextResponse.json({ error: "busy" }, { status: 429 });
  const text = await readCappedBody(request, 2_000);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!isIdempotencyKey(body.idempotencyKey)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = EmailCodeRequestSchema.safeParse({ email: body.email });
  if (!parsed.success) return NextResponse.json({ error: "email" }, { status: 422 });
  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;
  if (!(await verifyTurnstile(token, ip))) {
    return NextResponse.json({ error: "challenge" }, { status: 400 });
  }
  const outcome = await once(body.idempotencyKey, () =>
    requestEmailCode(parsed.data.email, {
      clientIp: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    }),
  );
  if (outcome.ok) return NextResponse.json({ sent: true }, { status: 202 });
  const status = outcome.reason === "busy" ? 429 : outcome.reason === "off" ? 404 : 503;
  return NextResponse.json({ error: outcome.reason }, { status });
}
