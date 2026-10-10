import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteCart } from "@/lib/data/orders";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 8_192;
const allow = createRateLimiter({ limit: 60, windowMs: 60_000 });

const QuoteRequestSchema = z
  .object({
    lines: z
      .array(
        z
          .object({
            variantId: z.string().min(1).max(60),
            quantity: z.number().int().min(1).max(99),
          })
          .strict(),
      )
      .max(50),
    couponCode: z.string().trim().max(24).optional(),
    delivery: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("zone"), zoneId: z.string().min(1).max(40) }).strict(),
      z.object({ kind: z.literal("pickup") }).strict(),
    ]),
  })
  .strict();

/** Prices a cart from the current catalogue (cart page, checkout summary): variant ids and quantities in, a quote out. */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!allow(`quote:${clientKey(request.headers)}`)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const text = await readCappedBody(request, MAX_BODY_BYTES);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = QuoteRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 422 });
  return NextResponse.json(await quoteCart(parsed.data), {
    headers: { "Cache-Control": "no-store" },
  });
}
