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

/**
 * Rows of a CSV file as text cells (RFC 4180, as Excel and Google Sheets save it): a byte order mark, CRLF or LF,
 * quoted cells with commas, quotes and line breaks. Empty lines are dropped. A cell `csvCell` neutralised with a
 * leading apostrophe ("'=SUM") reads back as it was written, so an import round-trips its export.
 */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith(CSV_BOM) ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let wasQuoted = false;
  const endCell = () => {
    row.push(wasQuoted && /^'[=+\-@\t\r]/.test(cell) ? cell.slice(1) : cell);
    cell = "";
    wasQuoted = false;
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
  };
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
      wasQuoted = true;
    } else if (char === ",") {
      endCell();
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      endRow();
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}
