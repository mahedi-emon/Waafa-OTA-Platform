import { NextResponse } from "next/server";
import { CsvImportKeySchema } from "@waafa/shared";
import { adminDownload } from "@/lib/admin/adminApi";

/** A list as the CSV file its import reads (issue 248): products, group fares or compatible models. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/secure-admin-control/api/content/[key]/export">,
) {
  const { key } = await params;
  const list = CsvImportKeySchema.safeParse(key);
  if (!list.success) return NextResponse.json({ error: "unknown" }, { status: 404 });
  const response = await adminDownload(`/admin/content/${list.data}/export.csv`);
  if (response.status === 401) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (response.status === 403) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!response.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return new Response(response.body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition":
        response.headers.get("content-disposition") ?? `attachment; filename="${list.data}.csv"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
