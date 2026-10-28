import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

/** A quote's PDF for staff (issue 298): the API renders it for whoever may open the lead. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/quotes/[id]/pdf">,
) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id))
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(`/admin/quotes/${id}/pdf`);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (response.status === 404) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(response.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": response.headers.get("content-disposition") ?? "inline",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
