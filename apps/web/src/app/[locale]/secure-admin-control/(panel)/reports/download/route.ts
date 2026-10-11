import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

const DATASETS = new Set(["leads", "orders", "feedback", "subscribers"]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** CSV downloads from Admin › Reports (issue 111), streamed from the API with the staff session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!DATASETS.has(dataset) || !DAY.test(from) || !DAY.test(to)) {
    return NextResponse.json({ error: "Choose a report and a date range" }, { status: 400 });
  }
  const response = await adminDownload(`/admin/reports/${dataset}.csv`, { from, to });
  if (response.status === 401)
    return NextResponse.redirect(new URL("/secure-admin-control/sign-in", request.url));
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: response.status });
  return new Response(response.body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="waafa-${dataset}-${from}-to-${to}.csv"`,
      "cache-control": "no-store",
    },
  });
}
