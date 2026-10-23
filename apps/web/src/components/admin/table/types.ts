import type { ReactNode } from "react";

/*
 * What a list hands the DataTable (D0 R5, ADMIN.md §10): plain rows the server already put into words, so every list
 * uses one component and no id, code or raw value reaches the screen.
 */

/** Which chip set a chip belongs to (tone and icon come from lib/admin/statusChips). */
export type ChipFamily = "record" | "lead" | "order" | "proof" | "feedback" | "user" | "overdue";

export type ChipView = { family: ChipFamily; name: string; label: string; reason?: string };

/** One cell's words. `money` and `date` get tabular figures; `muted` is secondary text. */
export type FactView = { text: string; kind?: "money" | "date" | "muted" };

export type RowThumb = { src: string; alt: string } | { initials: string };

export type DataRow = {
  id: string;
  /** The editor or detail page; the sheet's main button opens it. */
  href?: string;
  title: string;
  subtitle?: string;
  thumb?: RowThumb;
  chips: ChipView[];
  facts: Record<string, FactView | undefined>;
  sample?: boolean;
  /** Label and value pairs the side sheet lists. */
  summary?: Array<{ label: string; value: string }>;
  /** Buttons for this row, rendered on the server (Verify, Approve…); shown in the side sheet. */
  actions?: ReactNode;
  /** One-tap buttons on the phone card (Call, WhatsApp), so the commonest step needs no sheet. */
  quick?: ReactNode;
};

export type ColumnSpec = {
  key: string;
  label: string;
  /** The server's sort key; absent means the column can't be sorted. */
  sort?: string;
  /** Kept visible whatever the column settings say (the name and the status). */
  always?: boolean;
  align?: "end";
};

export type FilterSpec = {
  /** The query parameter, e.g. "status". */
  param: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

/** A bulk action: a server action bound to its list, given the selected ids (and a choice when it asks for one). */
export type BulkAction = {
  id: string;
  label: string;
  danger?: boolean;
  /** Asked before running ("Move 3 records to Trash?"); {count} is replaced. */
  confirm?: string;
  /** A choice made first (Assign to…). */
  choices?: { label: string; options: Array<{ value: string; label: string }> };
  run: (
    ids: string[],
    choice?: string,
  ) => Promise<{ ok: boolean; changed?: number; message?: string }>;
};

export type ListPage = { total: number; page: number; pageSize: number };
