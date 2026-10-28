import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ReviewInputSchema, ReviewKindSchema } from "@waafa/shared";
import { accountWrite, reviewEligibility } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });
const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Whether the signed-in customer may review this package or product (issue 245); read after hydration. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = ReviewKindSchema.safeParse(url.searchParams.get("kind"));
  const targetId = url.searchParams.get("targetId") ?? "";
  if (!kind.success || !ID.test(targetId))
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return NextResponse.json(await reviewEligibility(kind.data, targetId, token), {
    headers: { "cache-control": "no-store" },
  });
}

/**
 * A review from a signed-in customer (issue 245): same-site, 4 KB, 5 a minute per visitor. The API checks they booked
 * or received the item, so a review cannot be invented; it waits for staff before it shows.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!allow(`review:${clientKey(request.headers)}`))
    return NextResponse.json({ error: "busy" }, { status: 429 });
  const text = await readCappedBody(request, 4_000);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let parsed;
  try {
    parsed = ReviewInputSchema.safeParse(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 422 });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const outcome = await accountWrite("reviews", token, parsed.data);
  if (outcome.ok) return NextResponse.json({ ok: true });
  const error =
    outcome.status === 401
      ? "signed-out"
      : outcome.status === 403
        ? "not-eligible"
        : outcome.status === 409
          ? "reviewed"
          : outcome.status === 429
            ? "busy"
            : "unavailable";
  return NextResponse.json({ ok: false, error }, { status: outcome.status === 429 ? 429 : 200 });
}
