/*
 * Visa document checks (FR-VISA-05): JPG, PNG or PDF up to 5 MB each. In Phase A files never leave the browser;
 * only their name, type and size travel with the request. Phase C uploads them to the private bucket.
 */

export const VISA_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export type VisaFileType = (typeof VISA_FILE_TYPES)[number];
export const MAX_VISA_FILE_BYTES = 5 * 1024 * 1024;
export const VISA_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

const BY_EXTENSION: Record<string, VisaFileType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export type VisaFileCheck =
  | { ok: true; mimeType: VisaFileType }
  | { ok: false; error: "fileType" | "fileSize" | "fileEmpty" };

/** The file's type from its MIME type, or from the extension when the browser leaves the type empty. */
function typeOf(file: { name: string; type: string }): VisaFileType | null {
  if ((VISA_FILE_TYPES as readonly string[]).includes(file.type)) return file.type as VisaFileType;
  if (file.type) return null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? null;
}

export function checkVisaFile(file: { name: string; type: string; size: number }): VisaFileCheck {
  const mimeType = typeOf(file);
  if (!mimeType) return { ok: false, error: "fileType" };
  if (file.size <= 0) return { ok: false, error: "fileEmpty" };
  if (file.size > MAX_VISA_FILE_BYTES) return { ok: false, error: "fileSize" };
  return { ok: true, mimeType };
}

/** "2.4 MB", "820 KB" for the uploaded file line. */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
