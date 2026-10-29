import { NextResponse } from "next/server";
import { OnlineGatewaySchema, PaymentEventSchema } from "@waafa/shared";
import { confirmPayment } from "@/lib/data/payments";
import { readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 30, windowMs: 60_000 });

/** The gateway's fields, from the address (bKash, Nagad) or a posted form (SSLCommerz). */
async function paramsOf(request: Request): Promise<Record<string, string>> {
  const params: Record<string, string> = Object.fromEntries(new URL(request.url).searchParams);
  if (request.method === "POST") {
    const text = (await readCappedBody(request, 16_384)) ?? "";
    const type = request.headers.get("content-type") ?? "";
    if (type.includes("application/json")) {
      try {
        for (const [key, value] of Object.entries(JSON.parse(text) as Record<string, unknown>))
          if (typeof value === "string") params[key] = value;
      } catch {
        // Not JSON after all: nothing to add.
      }
    } else {
      for (const [key, value] of new URLSearchParams(text)) params[key] = value;
    }
  }
  return Object.fromEntries(
    Object.entries(params)
      .slice(0, 80)
      .map(([k, v]) => [k.slice(0, 60), v.slice(0, 2000)]),
  );
}

/**
 * Where SSLCommerz, bKash and Nagad send the customer (success, fail, cancel, callback) and their server (ipn) back
 * (issue 251). Nothing here is trusted: the API asks the gateway before it marks an order paid. The customer lands on
 * /shop/payment with the outcome; the gateway's server gets a plain OK.
 */
async function handle(
  request: Request,
  { params }: RouteContext<"/api/payments/[gateway]/[event]">,
) {
  const { gateway, event } = await params;
  const gw = OnlineGatewaySchema.safeParse(gateway);
  const ev = PaymentEventSchema.safeParse(event);
  if (!gw.success || !ev.success) return NextResponse.json({ error: "unknown" }, { status: 404 });
  if (!allow(`payment-returns:${clientKey(request.headers)}`))
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  let result: { reference: string; outcome: string };
  try {
    result = await confirmPayment(gw.data, { event: ev.data, params: await paramsOf(request) });
  } catch {
    result = { reference: "", outcome: "pending" };
  }
  if (ev.data === "ipn") return new NextResponse("OK", { status: 200 });
  const target = new URL("/shop/payment", request.url);
  target.searchParams.set("outcome", result.outcome);
  if (/^ORD-\d{6}-\d{4,6}$/.test(result.reference))
    target.searchParams.set("order", result.reference);
  return NextResponse.redirect(target, 303);
}

export const GET = handle;
export const POST = handle;
