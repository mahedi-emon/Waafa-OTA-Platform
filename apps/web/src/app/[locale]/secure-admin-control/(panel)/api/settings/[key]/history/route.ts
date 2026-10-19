import { NextResponse } from "next/server";
import { CONTENT_MODEL, isContentKey } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

/** A setting's saved versions for the editor's History tab (D0 R2). */
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
  return new Response(response.body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
