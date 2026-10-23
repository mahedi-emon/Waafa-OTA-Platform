import { NextResponse } from "next/server";
import { MediaListQuerySchema, MediaListSchema } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

/**
 * Library files for the pickers and the library (D0 R3): search, photos or videos, unused only, by page. The shape
 * is checked here on the server, so the browser needs no zod (D202).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = MediaListQuerySchema.safeParse(Object.fromEntries(params));
  if (!query.success) return NextResponse.json({ error: "bad query" }, { status: 400 });
  const forwarded: Record<string, string> = {};
  for (const [key, value] of Object.entries(query.data))
    if (value !== undefined) forwarded[key] = String(value);
  const response = await adminDownload("/admin/media", forwarded);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  const list = MediaListSchema.safeParse(await response.json());
  if (!list.success) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(list.data, { headers: { "cache-control": "no-store" } });
}
