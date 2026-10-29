import { NextResponse } from "next/server";
import { saveLeadDraft } from "@/lib/data/leads";
import { intakeFailure } from "@/lib/http/intakeFailure";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 2_048;
const allow = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * Step 1 of a request with the visitor's OK to be called if they don't finish (FR-FLT-08, issue 250): same-site
 * only, 2 KB, 5 a minute per client, validated against the shared contract; the API keeps one per phone and service.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`lead-drafts:${ip}`))
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
    const kept = await saveLeadDraft(body, { clientIp: ip });
    return kept
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ error: "invalid" }, { status: 422 });
  } catch (error) {
    return intakeFailure(error);
  }
}
