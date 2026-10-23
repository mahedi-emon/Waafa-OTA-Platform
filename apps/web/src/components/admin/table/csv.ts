import type { ColumnSpec, DataRow } from "./types";

/** A spreadsheet-safe CSV cell: quoted, inner quotes doubled, formulas defused with a leading apostrophe. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** The rows as the list shows them: name, status words, then each visible column's words. */
export function rowsToCsv(rows: DataRow[], columns: ColumnSpec[]): string {
  const facts = columns.filter((column) => column.key !== "name" && column.key !== "status");
  const header = [
    columns.find((column) => column.key === "name")?.label ?? "Name",
    "Status",
  ].concat(facts.map((column) => column.label));
  const lines = rows.map((row) =>
    [row.title, row.chips.map((chip) => chip.label).join(", ")]
      .concat(facts.map((column) => row.facts[column.key]?.text ?? ""))
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...lines].join("\r\n");
}
