import { NextResponse } from "next/server";
import { VIDEO_MAX_BYTES, VIDEO_TYPES } from "@waafa/shared";
import { adminUpload } from "@/lib/admin/adminApi";

const problem = (status: number, detail: string) =>
  NextResponse.json({ status, title: "Upload refused", detail }, { status });

/**
 * Media library video upload (D0 R3): the browser posts an MP4 or WebM up to 50 MB as the raw body with its words in
 * the query; it is passed on to the API as a stream (nginx raises the body limit for this route alone). Same-origin
 * only; the API checks the bytes.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== (request.headers.get("host") ?? url.host)) {
    return problem(403, "Cross-site uploads are not allowed");
  }
  const type = request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!(VIDEO_TYPES as readonly string[]).includes(type))
    return problem(415, "Upload an MP4 or WebM video");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(length) || length <= 0) return problem(411, "Send the video's size");
  if (length > VIDEO_MAX_BYTES) return problem(413, "Videos can be up to 50 MB");
  if (!request.body) return problem(400, "Choose a video to upload");
  const query: Record<string, string> = { alt: (url.searchParams.get("alt") ?? "").slice(0, 200) };
  const name = url.searchParams.get("name")?.slice(0, 160);
  const credit = url.searchParams.get("credit")?.slice(0, 120);
  if (name) query.name = name;
  if (credit) query.credit = credit;
  const result = await adminUpload<unknown>("/admin/media/video", request.body, type, query, {
    length,
    timeoutMs: 180_000,
  });
  return result.ok
    ? NextResponse.json(result.data, { status: 201 })
    : NextResponse.json(result.problem, { status: result.problem.status });
}
