import { formatTaka } from "@waafa/shared";

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
