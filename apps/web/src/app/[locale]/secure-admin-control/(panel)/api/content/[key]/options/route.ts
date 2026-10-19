import { NextResponse } from "next/server";
import { CONTENT_MODEL, isContentKey } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

/** Choices for a reference picker: every record of one list with its title, photo and status (D0 R2). */
export async function GET(
  request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/content/[key]/options">,
) {
  const { key } = await params;
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "collection")
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80);
  const response = await adminDownload(
    `/admin/content/${key}/options`,
    query ? { q: query } : undefined,
  );
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(response.body, {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
