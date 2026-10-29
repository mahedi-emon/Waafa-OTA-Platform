import { NextResponse } from "next/server";
import { startPayment } from "@/lib/data/payments";
import { intakeFailure } from "@/lib/http/intakeFailure";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

/** Sends the visitor to the payment gateway for the order they just placed (issue 251); same-site, 1 KB. */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`payments:${ip}`))
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const text = await readCappedBody(request, 1_024);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });
  try {
    const started = await startPayment(JSON.parse(text) as unknown, ip);
    return started
      ? NextResponse.json(started)
      : NextResponse.json({ error: "unavailable" }, { status: 409 });
  } catch (error) {
    if (error instanceof SyntaxError)
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    return intakeFailure(error);
  }
}
