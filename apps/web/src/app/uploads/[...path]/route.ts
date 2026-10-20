import { MEDIA_FILE_PATH } from "@waafa/shared/helpers/media";
import { apiConfig } from "@/lib/data/api/apiClient";

/** What each library file is ("2026/10/<id>.webp", ".mp4" or ".webm", the only shapes the library writes). */
const TYPES: Record<string, string> = { webp: "image/webp", mp4: "video/mp4", webm: "video/webm" };

/**
 * Library files (issue 109, D0 R3). In production nginx serves /uploads/ from the API before a request reaches the
 * web; this route covers development, CI and the image optimiser's own fetches (next/image reads local paths through
 * the app), streaming the file from the API. Byte ranges pass through, so a video can seek.
 */
export async function GET(request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  const { path } = await params;
  const relative = path.join("/");
  const api = apiConfig();
  if (!api || !MEDIA_FILE_PATH.test(relative)) return new Response("Not found", { status: 404 });
  const range = request.headers.get("range");
  // Waits ten seconds for the answer to start; a long video then streams for as long as it takes.
  const waiting = new AbortController();
  const timer = setTimeout(() => waiting.abort(), 10_000);
  const upstream = await fetch(`${api.baseUrl}/api/v1/media/${relative}`, {
    cache: "no-store",
    headers: range ? { range } : {},
    signal: waiting.signal,
  }).catch(() => null);
  clearTimeout(timer);
  if (!upstream || ![200, 206, 416].includes(upstream.status))
    return new Response("Not found", { status: 404 });
  const headers = new Headers({
    "content-type":
      TYPES[relative.slice(relative.lastIndexOf(".") + 1)] ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "accept-ranges": "bytes",
  });
  for (const name of ["content-length", "content-range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.status === 416 ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}
