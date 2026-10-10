import { formatPlainDate, humanize } from "./format";

export type DisplayRow = { label: string; value: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function scalar(value: unknown, yes: string, no: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? yes : no;
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return ISO_DATE.test(value) ? formatPlainDate(value) : value;
  return null;
}

/**
 * A lead's request as readable rows for staff: nested fields become "Search › Legs 1 › From", lists of words join
 * with commas, dates read "14 Nov 2026", empty fields are skipped. `module` is shown elsewhere and left out.
 */
export function flattenForDisplay(
  value: unknown,
  words: { yes: string; no: string } = { yes: "Yes", no: "No" },
  prefix: string[] = [],
  rows: DisplayRow[] = [],
): DisplayRow[] {
  const label = () => prefix.map(humanize).join(" › ");
  const simple = scalar(value, words.yes, words.no);
  if (simple !== null) {
    rows.push({ label: label(), value: simple });
    return rows;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return rows;
    if (value.every((item) => scalar(item, words.yes, words.no) !== null)) {
      rows.push({
        label: label(),
        value: value.map((item) => scalar(item, words.yes, words.no)).join(", "),
      });
      return rows;
    }
    value.forEach((item, index) =>
      flattenForDisplay(item, words, [...prefix, String(index + 1)], rows),
    );
    return rows;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (prefix.length === 0 && key === "module") continue;
      flattenForDisplay(child, words, [...prefix, key], rows);
    }
  }
  return rows;
}
