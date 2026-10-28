import { NextResponse } from "next/server";
import { QuoteAcceptInputSchema } from "@waafa/shared";
import { acceptQuote } from "@/lib/data/quotes";
import { intakeFailure } from "@/lib/http/intakeFailure";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 2_048;
const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * Accept on a customer's quote (issue 298): same-site only, 2 KB, 5 a minute per client, Turnstile when it is on.
 * Accepting is naturally repeatable (the same option answers the same), so it needs no idempotency key.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`quote-accept:${ip}`))
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const text = await readCappedBody(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = QuoteAcceptInputSchema.safeParse({ token: body.token, optionId: body.optionId });
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 422 });
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json({ error: "challenge" }, { status: 400 });
  }
  try {
    const outcome = await acceptQuote(parsed.data.token, parsed.data.optionId, { clientIp: ip });
    return outcome.ok
      ? NextResponse.json(outcome.quote, { status: 200 })
      : NextResponse.json({ error: outcome.error }, { status: outcome.status });
  } catch (error) {
    return intakeFailure(error);
  }
}
