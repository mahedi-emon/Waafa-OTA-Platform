import { NextResponse } from "next/server";
import { CONTENT_MODEL, ContentHistorySchema, isContentKey } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

/** A setting's saved versions for the editor's History tab (D0 R2), checked here so the browser needs no zod. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/settings/[key]/history">,
) {
  const { key } = await params;
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "singleton")
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(`/admin/settings/${key}/history`);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  const history = ContentHistorySchema.safeParse(await response.json());
  if (!history.success) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(history.data, { headers: { "cache-control": "no-store" } });
}
