import { NextResponse } from "next/server";
import { CONTENT_MODEL, isContentKey } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

const ID = /^[\w-]{1,160}$/;

/** One record of a list, for editors that read another record (a deal's product variants). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/content/[key]/[id]">,
) {
  const { key, id } = await params;
  const recordId = decodeURIComponent(id);
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "collection" || !ID.test(recordId))
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(`/admin/content/${key}/${encodeURIComponent(recordId)}`);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (response.status === 404) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(response.body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
