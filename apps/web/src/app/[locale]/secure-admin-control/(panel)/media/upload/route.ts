import { NextResponse } from "next/server";
import { adminUpload } from "@/lib/admin/adminApi";

const MAX_BYTES = 12 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const problem = (status: number, detail: string) =>
  NextResponse.json({ status, title: "Upload refused", detail }, { status });

/**
 * Media library upload (issue 109): the browser posts the photo as the raw body with its alt text in the query; the
 * staff session cookie authorises the call to the API, which checks the bytes and re-encodes the photo. Same-origin
 * only.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== (request.headers.get("host") ?? url.host)) {
    return problem(403, "Cross-site uploads are not allowed");
  }
  const type = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!TYPES.has(type)) return problem(415, "Upload a JPEG, PNG, WebP or AVIF photo");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return problem(413, "Photos can be up to 12 MB");
  }
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return problem(413, "Photos can be up to 12 MB");
  const alt = (url.searchParams.get("alt") ?? "").slice(0, 200);
  const name = (url.searchParams.get("name") ?? "").slice(0, 160);
  const result = await adminUpload<unknown>("/admin/media", body, type, {
    alt,
    ...(name ? { name } : {}),
  });
  return result.ok
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json(result.problem, { status: result.problem.status });
}
