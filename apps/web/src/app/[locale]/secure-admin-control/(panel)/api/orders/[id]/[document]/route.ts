import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

const DOCUMENTS = new Set(["invoice", "packing-slip"]);

/** An order's invoice or packing slip PDF for staff (issue 248): the API renders it for the roles that may print it. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/orders/[id]/[document]">,
) {
  const { id, document } = await params;
  if (!/^[a-z0-9]{10,40}$/.test(id) || !DOCUMENTS.has(document))
    return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(`/admin/orders/${id}/${document}`);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (response.status === 403) return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
