/** Reads at most `max` bytes of a request body as text; null when it is longer (the stream is cancelled). */
export async function readCappedBody(request: Request, max: number): Promise<string | null> {
  const bytes = await readCappedBytes(request, max);
  return bytes === null ? null : new TextDecoder().decode(bytes);
}

/** Reads at most `max` bytes of a request body; null when it is longer (the stream is cancelled). */
export async function readCappedBytes(request: Request, max: number): Promise<Buffer | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > max) return null;
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/** Rejects cross-site browser requests (Sec-Fetch-Site); requests without the header (tests, curl) pass. */
export function isSameSite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin";
}
