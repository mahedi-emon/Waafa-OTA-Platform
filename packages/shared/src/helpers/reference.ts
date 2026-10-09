/** Bangladesh Standard Time is UTC+6 all year (no daylight saving since 2009). */
export const DHAKA_OFFSET_MINUTES = 6 * 60;

const REFERENCE_PATTERN = /^([A-Z]{3})-(\d{2})(\d{2})(\d{2})-(\d{4})$/;

/** Shifts a moment so its UTC fields read as Asia/Dhaka wall-clock time. */
export function toDhakaWallClock(moment: Date): Date {
  return new Date(moment.getTime() + DHAKA_OFFSET_MINUTES * 60_000);
}

/** A moment as an ISO timestamp in Asia/Dhaka, `"2026-10-09T11:03:00+06:00"`, for API records. */
export function toDhakaIsoString(moment: Date): string {
  return `${toDhakaWallClock(moment).toISOString().slice(0, 19)}+06:00`;
}

/** The calendar date in Asia/Dhaka, `"2026-10-09"`. */
export function toDhakaDateString(moment: Date): string {
  return toDhakaWallClock(moment).toISOString().slice(0, 10);
}

/**
 * Builds a reference such as "FLT-261008-0042": prefix, date (YYMMDD, Asia/Dhaka) and a per-day sequence.
 * The API assigns the sequence atomically; fixtures pass it explicitly.
 */
export function makeReference(prefix: string, moment: Date, sequence: number): string {
  if (!/^[A-Z]{3}$/.test(prefix))
    throw new RangeError(`Reference prefix must be three capitals, got "${prefix}"`);
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new RangeError(`Reference sequence must be 1 to 9999, got ${sequence}`);
  }
  const local = toDhakaWallClock(moment);
  const yy = String(local.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(local.getUTCDate()).padStart(2, "0");
  return `${prefix}-${yy}${mm}${dd}-${String(sequence).padStart(4, "0")}`;
}

export type ParsedReference = { prefix: string; date: string; sequence: number };

/** Parses "FLT-261008-0042" into its parts (date as "2026-10-08"); null when it is not a reference. */
export function parseReference(reference: string): ParsedReference | null {
  const match = REFERENCE_PATTERN.exec(reference.trim().toUpperCase());
  if (!match) return null;
  const [, prefix, yy, mm, dd, seq] = match;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { prefix: prefix!, date: `20${yy}-${mm}-${dd}`, sequence: Number(seq) };
}
