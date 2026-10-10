import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

const ALLOWED = ["view", "module", "status", "q", "assigneeId", "createdFrom", "createdTo"];

/** CSV export of the current lead filter (FR-ADM-LEAD), streamed from the API with the staff session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  for (const key of ALLOWED) {
    const value = url.searchParams.get(key);
    if (value) query[key] = value.slice(0, 80);
  }
  const response = await adminDownload("/admin/leads/export.csv", query);
  if (response.status === 401) return NextResponse.redirect(new URL("/admin/sign-in", request.url));
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: response.status });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(response.body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="waafa-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
