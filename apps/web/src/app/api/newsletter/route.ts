import { NextResponse } from "next/server";
import { subscribe } from "@/lib/data/leads";
import { intakeFailure } from "@/lib/http/intakeFailure";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 1_024;
const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });

/** Footer newsletter sign-up (FR-FTR-05): same-site only, 1 KB, 5 per minute per client. */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`newsletter:${ip}`))
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const text = await readCappedBody(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const stored = await subscribe(body, { clientIp: ip });
    if (!stored) return NextResponse.json({ error: "invalid" }, { status: 422 });
    return new Response(null, { status: 204 });
  } catch (error) {
    return intakeFailure(error);
  }
}
