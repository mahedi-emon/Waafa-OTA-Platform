import type { MediaAsset } from "@waafa/shared";
import type { UploadOutcome } from "./uploadMedia";

export type UploadProblem = Extract<UploadOutcome, { ok: false }>["reason"];

export type UploadItem = {
  key: string;
  file: File;
  /** What the upload is for, when one queue serves several places (a video's MP4 and WebM). */
  tag?: string;
  /** A local preview of a photo while it uploads (revoked when the item goes). */
  preview: string | null;
  /** 0 to 1. */
  progress: number;
  status: "waiting" | "uploading" | "done" | "failed";
  problem?: UploadProblem;
  asset?: MediaAsset;
};

/** Two at a time: each photo is re-encoded on the server, so a dropped folder doesn't queue twenty at once. */
export const UPLOADS_AT_ONCE = 2;

/** The waiting files to start now, oldest first, so no more than `atOnce` are on their way. */
export function nextToStart(items: readonly UploadItem[], atOnce = UPLOADS_AT_ONCE): UploadItem[] {
  const running = items.filter((item) => item.status === "uploading").length;
  return items.filter((item) => item.status === "waiting").slice(0, Math.max(0, atOnce - running));
}

/** A failed upload queued again from the start: same file, place and preview; the old problem goes. */
export function retried(item: UploadItem): UploadItem {
  return {
    key: item.key,
    file: item.file,
    ...(item.tag ? { tag: item.tag } : {}),
    preview: item.preview,
    progress: 0,
    status: "waiting",
  };
}
