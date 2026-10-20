"use client";

import type { MediaAsset } from "@waafa/shared";
import { checkMediaFile, mediaKindOf, type FileProblem } from "@waafa/shared/helpers/media";

export type UploadOutcome =
  | { ok: true; asset: MediaAsset }
  | {
      ok: false;
      reason: FileProblem | "unreadable" | "signedOut" | "server" | "offline";
      detail?: string;
    };

const ROUTES = {
  photo: "/secure-admin-control/media/upload",
  video: "/secure-admin-control/media/upload-video",
} as const;

/** "beach-day_01.jpg" → "Beach day 01": a starting point for the alt text, which staff then improve. */
export function altFromName(name: string): string {
  const words = name
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

/**
 * Sends one photo or video to the library with progress (fetch can't report upload progress, XHR can). The file is
 * checked first (type, size), so a wrong file never leaves the browser.
 */
export function uploadMedia(
  file: File,
  meta: { alt: string; credit?: string },
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<UploadOutcome> {
  const kind = mediaKindOf(file.type);
  const problem = checkMediaFile(file, kind);
  if (problem) return Promise.resolve({ ok: false, reason: problem });
  const query = new URLSearchParams({ alt: meta.alt, name: file.name.slice(0, 160) });
  if (meta.credit) query.set("credit", meta.credit);
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${ROUTES[kind]}?${query.toString()}`);
    request.setRequestHeader("content-type", file.type);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status === 201) {
        resolve({ ok: true, asset: request.response as MediaAsset });
        return;
      }
      const body = request.response as { detail?: string } | null;
      const reason =
        request.status === 401
          ? "signedOut"
          : request.status === 413
            ? "size"
            : request.status === 415
              ? "type"
              : request.status === 422
                ? "unreadable"
                : "server";
      resolve({ ok: false, reason, ...(body?.detail ? { detail: body.detail } : {}) });
    };
    request.onerror = () => resolve({ ok: false, reason: navigator.onLine ? "server" : "offline" });
    request.onabort = () => resolve({ ok: false, reason: "server", detail: "Cancelled" });
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });
}
