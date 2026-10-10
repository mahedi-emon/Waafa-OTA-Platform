import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/data/tags";
import { readCappedBody } from "@/lib/http/readCappedBody";
import { verifySignature } from "@/lib/http/signature";

const BodySchema = z.object({
  keys: z.array(z.string().min(1).max(60)).min(1).max(200),
  at: z.string().max(40).optional(),
});

/** Older than this, a signed call is refused, so a captured request can't be replayed later. */
const MAX_AGE_MS = 5 * 60_000;

/**
 * The API calls this after every admin save (D130): the body is signed with REVALIDATE_SECRET (HMAC-SHA256, header
 * x-waafa-signature). Every public accessor reads the one snapshot, so a change expires the snapshot and every data
 * tag at once; the next visitor gets fresh content.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ error: "not-configured" }, { status: 404 });
  const text = await readCappedBody(request, 8_192);
  if (text === null) return NextResponse.json({ error: "too-large" }, { status: 413 });
  if (!verifySignature(text, request.headers.get("x-waafa-signature"), secret)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (parsed.at && Math.abs(Date.now() - Date.parse(parsed.at)) > MAX_AGE_MS) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }
  const tags = Object.values(CACHE_TAGS);
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: tags, keys: parsed.keys });
}
