import { NextResponse } from "next/server";
import { placeOrder, type PlaceOrderResult } from "@/lib/data/orders";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { createIdempotencyStore, isIdempotencyKey } from "@/lib/leads/idempotency";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 16_384;
const allow = createRateLimiter({ limit: 6, windowMs: 60_000 });
const once = createIdempotencyStore<PlaceOrderResult>({ ttlMs: 10 * 60_000 });

/**
 * Checkout intake (FR-SHOP-07): same-site only, 16 KB, 6 per minute per client, Turnstile when configured, idempotent
 * per key (a double tap places one order). The body carries variant ids, quantities and the customer's choices; the
 * server prices the order, picks the delivery zone and checks the cash-on-delivery limit.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`orders:${ip}`)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  const text = await readCappedBody(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: { idempotencyKey?: unknown; turnstileToken?: unknown; order?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!isIdempotencyKey(body.idempotencyKey)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;
  if (!(await verifyTurnstile(token, ip))) {
    return NextResponse.json({ error: "challenge" }, { status: 400 });
  }

  try {
    const result = await once(body.idempotencyKey, () => placeOrder(body.order));
    if (result.ok) return NextResponse.json(result.order, { status: 201 });
    return NextResponse.json(
      { error: result.reason, quote: result.quote },
      { status: result.reason === "invalid" ? 422 : 409 },
    );
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
