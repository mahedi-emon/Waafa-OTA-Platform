/**
 * Media library rules shared by the admin and the API (D0 R3, docs/design/ADMIN.md §11). No zod here: the admin's
 * fields import these in the browser (D202).
 */

/** Photos the library takes; each one is re-encoded to WebP on the server. */
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const PHOTO_MAX_BYTES = 12 * 1024 * 1024;
/** Videos are kept as they arrive (no re-encoding on the server). */
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export type PhotoType = (typeof PHOTO_TYPES)[number];
export type VideoType = (typeof VIDEO_TYPES)[number];
export type MediaKind = "photo" | "video";

/** "2026/10/<id>.webp" for photos, ".mp4" or ".webm" for videos. */
export const MEDIA_FILE_PATH = /^\d{4}\/\d{2}\/[a-z0-9]{8,40}\.(webp|mp4|webm)$/;

/** Why a chosen file can't be uploaded, before it leaves the browser. */
export type FileProblem = "empty" | "type" | "size";

export function checkMediaFile(
  file: { type: string; size: number },
  kind: MediaKind,
): FileProblem | null {
  if (file.size <= 0) return "empty";
  const types: readonly string[] = kind === "photo" ? PHOTO_TYPES : VIDEO_TYPES;
  if (!types.includes(file.type)) return "type";
  if (file.size > (kind === "photo" ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES)) return "size";
  return null;
}

export function mediaKindOf(mime: string): MediaKind {
  return mime.startsWith("video/") ? "video" : "photo";
}

/** The library file behind an image or video address ("/uploads/2026/10/abc.webp" → "2026/10/abc.webp"). */
export function mediaPathOf(src: string): string | null {
  const match =
    /(?:^|\/)uploads\/(\d{4}\/\d{2}\/[a-z0-9]{8,40}\.(?:webp|mp4|webm))(?:[?#].*)?$/.exec(src);
  return match?.[1] ?? null;
}

/** The library file's id behind an address ("/uploads/2026/10/abc12345.webp" → "abc12345"); null for others. */
export function mediaIdOf(src: string): string | null {
  const path = mediaPathOf(src);
  return path ? path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf(".")) : null;
}

/** A point of a photo staff want kept in view, in percent from the top left. */
export type FocalPoint = { x: number; y: number };

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** CSS `object-position` for a focal point; undefined keeps the default centre. */
export function objectPositionOf(focal: FocalPoint | undefined): string | undefined {
  if (!focal) return undefined;
  return `${Math.round(clamp(focal.x, 0, 100))}% ${Math.round(clamp(focal.y, 0, 100))}%`;
}

/** Whether a photo is smaller than a field asks for ("at least 1600 px wide"). */
export function isTooSmall(
  size: { width: number; height: number },
  min: { width?: number; height?: number },
): boolean {
  return (
    (min.width !== undefined && size.width < min.width) ||
    (min.height !== undefined && size.height < min.height)
  );
}

export type CropArea = { x: number; y: number; width: number; height: number };

/** A crop held inside the image, in whole pixels, at least 16 px on each side. */
export function clampCrop(area: CropArea, image: { width: number; height: number }): CropArea {
  const width = Math.round(clamp(area.width, 16, image.width));
  const height = Math.round(clamp(area.height, 16, image.height));
  return {
    x: Math.round(clamp(area.x, 0, image.width - width)),
    y: Math.round(clamp(area.y, 0, image.height - height)),
    width,
    height,
  };
}

/** The largest crop of an aspect ratio (width / height) inside the image, centred on the focal point. */
export function centredCrop(
  image: { width: number; height: number },
  aspect: number,
  focal: FocalPoint = { x: 50, y: 50 },
): CropArea {
  const wide = image.width / image.height > aspect;
  const width = wide ? image.height * aspect : image.width;
  const height = wide ? image.height : image.width / aspect;
  return clampCrop(
    {
      x: (focal.x / 100) * image.width - width / 2,
      y: (focal.y / 100) * image.height - height / 2,
      width,
      height,
    },
    image,
  );
}

/** Bytes as staff read them: "850 KB", "3.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
