import { NextResponse } from "next/server";
import { adminDownload } from "@/lib/admin/adminApi";

const DATASETS = new Set(["leads", "orders", "feedback", "subscribers"]);
const FORMATS = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Report downloads from Admin › Reports as CSV or Excel (issue 111, D0 R9), streamed from the API with the session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") ?? "";
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!DATASETS.has(dataset) || !DAY.test(from) || !DAY.test(to)) {
    return NextResponse.json({ error: "Choose a report and a date range" }, { status: 400 });
  }
  const response = await adminDownload(`/admin/reports/${dataset}.${format}`, { from, to });
  if (response.status === 401)
    return NextResponse.redirect(new URL("/secure-admin-control/sign-in", request.url));
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: response.status });
  return new Response(response.body, {
    headers: {
      "content-type": FORMATS[format],
      "content-disposition": `attachment; filename="waafa-${dataset}-${from}-to-${to}.${format}"`,
      "cache-control": "no-store",
    },
  });
}
