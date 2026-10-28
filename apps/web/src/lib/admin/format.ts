import { formatTaka } from "@waafa/shared";

/**
 * Who last saved a record, in words: system names become what they are (the sample data, a site update, a store
 * order), people keep their names; "seed" is not a person (D0 R10).
 */
export function editorName(
  name: string | null | undefined,
  words: { sample: string; update: string; order: string },
): string | null {
  if (!name) return null;
  if (name === "seed") return words.sample;
  if (name === "seed-patch") return words.update;
  if (name === "order" || name === "order-cancel") return words.order;
  return name;
}

/** Two letters for an avatar: first and last name, or the first two letters of one name. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`
      : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

/** Lead age for tables: minutes, then hours, then days (the SLA turns rows red, not this). */
export function ageParts(minutes: number): { unit: "minutes" | "hours" | "days"; value: number } {
  if (minutes < 60) return { unit: "minutes", value: Math.max(0, minutes) };
  if (minutes < 48 * 60) return { unit: "hours", value: Math.floor(minutes / 60) };
  return { unit: "days", value: Math.floor(minutes / (24 * 60)) };
}

/** A list page number from the URL: a whole number from 1 to 10,000, whatever was typed (#78). */
export function pageParam(value: string | string[] | undefined): number {
  const raw = Math.trunc(Number(typeof value === "string" ? value : 1));
  return Number.isFinite(raw) ? Math.min(10_000, Math.max(1, raw)) : 1;
}

const DHAKA = "Asia/Dhaka";

/** "11 Oct 2026, 7:18 pm" in Asia/Dhaka, from an ISO time with any offset. */
export function formatDhakaDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DHAKA,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DHAKA,
  })
    .format(date)
    .toLowerCase();
  return `${day}, ${time}`;
}

/** "7:18 pm" in Asia/Dhaka (timelines put the date in the day's heading). */
export function formatDhakaTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DHAKA,
  })
    .format(date)
    .toLowerCase();
}

/** The Asia/Dhaka calendar day (YYYY-MM-DD) of an ISO time with any offset. */
export function dhakaDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  // Dhaka is UTC+6 all year.
  return new Date(date.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);
}

/** "12 Oct 2026" from YYYY-MM-DD (dates without a time are calendar dates, shown as they are). */
export function formatPlainDate(value: string | null | undefined): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** ৳ with lakh grouping (VAT included is said once on the page, not on every figure). */
export function taka(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : formatTaka(value);
}

/** "+880 1712-345678" style for display, from E.164; other numbers as they are. */
export function displayPhone(e164: string): string {
  const match = /^\+880(1\d{3})(\d{6})$/.exec(e164);
  return match ? `+880 ${match[1]}-${match[2]}` : e164;
}

/** wa.me link with a prefilled message. */
export function whatsappHref(e164: string, text: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** camelCase or kebab-case field name → "Sentence case" label for the generic editor. */
export function humanize(key: string): string {
  const spaced = key
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  const fixed = spaced
    .replace(/\bseo\b/g, "SEO")
    .replace(/\burl\b/g, "URL")
    .replace(/\bid\b/g, "ID")
    .replace(/\bsku\b/g, "SKU")
    .replace(/\bcod\b/g, "COD")
    .replace(/\biata\b/g, "IATA")
    .replace(/\bfaq\b/g, "FAQ")
    .replace(/\bemi\b/g, "EMI");
  return fixed.charAt(0).toUpperCase() + fixed.slice(1);
}

/** The calendar day in Asia/Dhaka some days from now, YYYY-MM-DD (a quote's earliest and default last day). */
export function dhakaDayFromNow(days = 0): string {
  return dhakaDay(new Date(Date.now() + days * 86_400_000).toISOString());
}
