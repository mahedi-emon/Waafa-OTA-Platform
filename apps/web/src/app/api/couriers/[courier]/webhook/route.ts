import { NextResponse } from "next/server";
import { forwardCourierWebhook, WEBHOOK_COURIERS } from "@/lib/data/couriers";
import { readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 120, windowMs: 60_000 });

/**
 * The courier's status webhook (issue 253): Steadfast posts each parcel's status here with the bearer token the owner
 * pasted into its panel. The API checks the token and updates the order; nothing here is trusted.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/couriers/[courier]/webhook">,
) {
  const { courier } = await params;
  if (!(WEBHOOK_COURIERS as readonly string[]).includes(courier))
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  if (!allow(`courier-webhook:${clientKey(request.headers)}`))
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token || token.length > 200)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let parsed: unknown = null;
  try {
    parsed = JSON.parse((await readCappedBody(request, 16_384)) ?? "null");
  } catch {
    parsed = null;
  }
  // Only a JSON object is a courier update: anything else (a string, a list, a cut-off body) is refused.
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  const payload = parsed as Record<string, unknown>;
  const status = await forwardCourierWebhook(courier, token, payload);
  return status === 200
    ? NextResponse.json({ status: "success", message: "Webhook received" })
    : NextResponse.json({ error: status === 401 ? "unauthorized" : "unavailable" }, { status });
}
