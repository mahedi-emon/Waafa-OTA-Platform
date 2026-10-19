import { NextResponse } from "next/server";
import { CONTENT_MODEL, ContentHistorySchema, isContentKey } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

const ID = /^[\w-]{1,160}$/;

/** A record's saved versions for the editor's History tab (D0 R2), checked here so the browser needs no zod. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/content/[key]/[id]/history">,
) {
  const { key, id } = await params;
  const recordId = decodeURIComponent(id);
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "collection" || !ID.test(recordId))
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(
    `/admin/content/${key}/${encodeURIComponent(recordId)}/history`,
  );
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  const history = ContentHistorySchema.safeParse(await response.json());
  if (!history.success) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(history.data, { headers: { "cache-control": "no-store" } });
}
