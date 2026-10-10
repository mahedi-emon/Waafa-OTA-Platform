import { logSearch } from "@/lib/data/leads";

const MAX_BODY_BYTES = 4096;

/**
 * Search logging (FR-SRCH-10). The card sends this with navigator.sendBeacon, so navigation never waits on
 * it; bad or oversized bodies are dropped without detail.
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const logged = await logSearch(body);
  return new Response(null, { status: logged ? 204 : 400 });
}
