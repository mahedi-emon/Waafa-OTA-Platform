import { NextResponse } from "next/server";
import { CUSTOMER_FILE_MAX_BYTES, CUSTOMER_FILE_TYPES } from "@waafa/shared";
import { adminUpload } from "@/lib/admin/adminApi";

const problem = (status: number, detail: string) =>
  NextResponse.json({ status, title: "Upload refused", detail }, { status });

/**
 * A document for a booking (issue 242: e-ticket, voucher, invoice): the browser posts the file as the raw body with
 * the booking id and file name in the query; the staff session cookie authorises the call. Same-origin only. The API
 * stores it on the private volume, scans it and checks the person may open the booking.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== (request.headers.get("host") ?? url.host)) {
    return problem(403, "Cross-site uploads are not allowed");
  }
  const type = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!(CUSTOMER_FILE_TYPES as readonly string[]).includes(type))
    return problem(415, "Upload a PDF, JPEG or PNG file");
  if (Number(request.headers.get("content-length") ?? 0) > CUSTOMER_FILE_MAX_BYTES)
    return problem(413, "Files can be up to 5 MB");
  const body = await request.arrayBuffer();
  if (body.byteLength > CUSTOMER_FILE_MAX_BYTES) return problem(413, "Files can be up to 5 MB");
  const id = url.searchParams.get("id") ?? "";
  const name = (url.searchParams.get("name") ?? "document").slice(0, 120);
  if (!/^[a-z0-9]{10,40}$/.test(id)) return problem(422, "Unknown booking");
  const result = await adminUpload<unknown>("/admin/files/attach", body, type, {
    owner: "booking",
    id,
    kind: "other",
    name,
  });
  return result.ok
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json(result.problem, { status: result.problem.status });
}
