import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

/** Admin › Customers › Export CSV (issue 244): every customer this person may see, streamed from the API. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const tag = (url.searchParams.get("tag") ?? "").slice(0, 30);
  const response = await adminDownload("/admin/customers/export.csv", { q, tag });
  if (response.status === 401)
    return NextResponse.redirect(new URL("/secure-admin-control/sign-in", request.url));
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: response.status });
  return new Response(response.body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="waafa-customers.csv"',
      "cache-control": "no-store",
    },
  });
}
