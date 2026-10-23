import { NextResponse } from "next/server";
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from "@waafa/shared";
import { adminUpload } from "@/lib/admin/adminApi";

const problem = (status: number, detail: string) =>
  NextResponse.json({ status, title: "Upload refused", detail }, { status });

/**
 * Media library photo upload (issue 109, D0 R3): the browser posts the photo as the raw body with its alt text,
 * name and credit in the query; the staff session cookie authorises the call to the API, which checks the bytes and
 * re-encodes the photo. Same-origin only.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== (request.headers.get("host") ?? url.host)) {
    return problem(403, "Cross-site uploads are not allowed");
  }
  const type = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!(PHOTO_TYPES as readonly string[]).includes(type))
    return problem(415, "Upload a JPEG, PNG, WebP or AVIF photo");
  if (Number(request.headers.get("content-length") ?? 0) > PHOTO_MAX_BYTES) {
    return problem(413, "Photos can be up to 12 MB");
  }
  const body = await request.arrayBuffer();
  if (body.byteLength > PHOTO_MAX_BYTES) return problem(413, "Photos can be up to 12 MB");
  const query: Record<string, string> = { alt: (url.searchParams.get("alt") ?? "").slice(0, 200) };
  const name = url.searchParams.get("name")?.slice(0, 160);
  const credit = url.searchParams.get("credit")?.slice(0, 120);
  if (name) query.name = name;
  if (credit) query.credit = credit;
  const result = await adminUpload<unknown>("/admin/media", body, type, query);
  return result.ok
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json(result.problem, { status: result.problem.status });
}
