import { logSearch } from "@/lib/data/leads";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 4096;
const allow = createRateLimiter({ limit: 30, windowMs: 60_000 });

/**
 * Search logging (FR-SRCH-10). The card sends this with navigator.sendBeacon, so navigation never waits on it.
 * Same-site requests only, 4 KB at most, 30 per minute per client; anything else is dropped without detail.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return new Response(null, { status: 403 });
  if (!allow(`search-log:${clientKey(request.headers)}`)) {
    return new Response(null, { status: 429 });
  }
  const text = await readCappedBody(request, MAX_BODY_BYTES);
  if (text === null) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const logged = await logSearch(body);
  return new Response(null, { status: logged ? 204 : 400 });
}
