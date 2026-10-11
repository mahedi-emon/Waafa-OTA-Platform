/** Excel reads UTF-8 CSV (taka sign, Bangla names) only with a byte order mark. */
export const CSV_BOM = "﻿";

/** One quoted cell; formulas are neutralised so a spreadsheet never runs a value (CSV injection). */
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Header and rows as CRLF-separated CSV (RFC 4180). */
export function toCsv(header: readonly string[], rows: ReadonlyArray<readonly unknown[]>): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
