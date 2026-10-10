import { logSearch } from "@/lib/data/leads";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 4096;
const allow = createRateLimiter({ limit: 30, windowMs: 60_000 });

/** Reads at most `max` bytes of the body; null when it is longer. */
async function readCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Search logging (FR-SRCH-10). The card sends this with navigator.sendBeacon, so navigation never waits on it.
 * Same-site requests only, 4 KB at most, 30 per minute per client; anything else is dropped without detail.
 */
export async function POST(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return new Response(null, { status: 403 });
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  if (!allow(`search-log:${clientKey(request.headers)}`))
    return new Response(null, { status: 429 });

  const text = await readCapped(request, MAX_BODY_BYTES);
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
