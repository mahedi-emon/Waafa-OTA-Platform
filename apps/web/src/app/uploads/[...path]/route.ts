import { apiConfig } from "@/lib/data/api/apiClient";

/** "2026/10/<id>.webp", the only shape the media library writes (issue 109). */
const MEDIA_PATH = /^\d{4}\/\d{2}\/[a-z0-9]{8,40}\.webp$/;

/**
 * Photos from the media library (issue 109). In production nginx serves /uploads/ from the API before a request
 * reaches the web; this route covers development and the image optimiser's own fetches (next/image reads local
 * paths through the app), streaming the file from the API.
 */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[...path]">) {
  const { path } = await params;
  const relative = path.join("/");
  const api = apiConfig();
  if (!api || !MEDIA_PATH.test(relative)) return new Response("Not found", { status: 404 });
  const upstream = await fetch(`${api.baseUrl}/api/v1/media/${relative}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!upstream?.ok || !upstream.body) return new Response("Not found", { status: 404 });
  return new Response(upstream.body, {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
