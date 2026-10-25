/**
 * Files visitors send with forms (issue 232): visa documents, payment-proof slips, printing and trading attachments
 * and the feedback photo. Zod-free so the browser can import these (D144).
 */

export const CUSTOMER_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export type CustomerFileType = (typeof CUSTOMER_FILE_TYPES)[number];

/** PRD FR-VISA-03: up to 5 MB per file. */
export const CUSTOMER_FILE_MAX_BYTES = 5 * 1024 * 1024;

/** An unclaimed upload is deleted after this long (the form was never sent). */
export const CUSTOMER_FILE_PENDING_MS = 6 * 60 * 60_000;

/** Unclaimed uploads one visitor may hold at a time (four visa slots of 5 MB, twice over). */
export const CUSTOMER_FILE_PENDING_PER_VISITOR_BYTES = 40 * 1024 * 1024;

/** Unclaimed uploads the whole site may hold at a time, so uploads can never fill the server's disk. */
export const CUSTOMER_FILE_PENDING_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;

/** Uploads pause when the private volume has less free space than this. */
export const CUSTOMER_FILE_MIN_FREE_BYTES = 2 * 1024 * 1024 * 1024;

/** Visa documents are deleted this long after their application closes (FR-VISA-05). */
export const VISA_DOCUMENT_RETENTION_MS = 90 * 24 * 60 * 60_000;

/** Signed staff links last ten minutes (FR-VISA-05). */
export const CUSTOMER_FILE_LINK_MS = 10 * 60_000;

export const CUSTOMER_FILE_OWNERS = ["lead", "payment-proof", "order", "feedback"] as const;
export type CustomerFileOwner = (typeof CUSTOMER_FILE_OWNERS)[number];

/** Storage keys are "cf_" plus 32 URL-safe characters (24 random bytes). */
export const STORAGE_KEY_PATTERN = /^cf_[A-Za-z0-9_-]{32}$/;

export function isStorageKey(value: unknown): value is string {
  return typeof value === "string" && STORAGE_KEY_PATTERN.test(value);
}

/**
 * The real type of a file from its first bytes, or null when it is not a JPEG, PNG or PDF. The declared type and
 * the file name are never trusted on their own.
 */
export function sniffCustomerFile(bytes: Uint8Array): CustomerFileType | null {
  const starts = (...signature: number[]) =>
    bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  return null;
}
