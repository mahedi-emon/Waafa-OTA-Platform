"use client";

import {
  memo,
  useCallback,
  useMemo,
  useState,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  columnVisibilityFeature,
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type ColumnVisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { cn } from "cn";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMinWidth } from "@/hooks/use-min-width";
import { Link, useRouter } from "@/i18n/navigation";
import { rowsToCsv } from "./csv";
import { DataTableBulkBar } from "./DataTableBulkBar";
import { DataTablePager } from "./DataTablePager";
import { DataTableSheet } from "./DataTableSheet";
import { DataTableToolbar } from "./DataTableToolbar";
import { nextSort, parseSort, withQuery } from "./listQuery";
import { RowChips } from "./RowChips";
import { RowThumbnail } from "./RowThumbnail";
import type { BulkAction, ColumnSpec, DataRow, FilterSpec, ListPage } from "./types";
import { useListPreferences } from "./useListPreferences";

export type DataTableViewProps = {
  /** Names this list's saved views and column settings on the device. */
  listKey: string;
  path: string;
  rows: DataRow[];
  /** The first column is the name ("name"), the second usually the status ("status"). */
  columns: ColumnSpec[];
  page: ListPage;
  searchLabel: string;
  filters?: FilterSpec[];
  bulk?: BulkAction[];
  exportHref?: string;
  openLabel: string;
  empty: { title: string; body: string; action?: ReactNode };
};

const features = tableFeatures({ rowSelectionFeature, columnVisibilityFeature });
const helper = createColumnHelper<typeof features, DataRow>();

/** The selection with one row on or off (TanStack keeps only selected ids). */
function toggled(current: RowSelectionState, id: string, on: boolean): RowSelectionState {
  const next = { ...current };
  if (on) next[id] = true;
  else delete next[id];
  return next;
}

/** Clicks on controls inside a row (checkbox, links, buttons) do their own job, never open the sheet. */
const fromControl = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest("a, button, input, label, [role=checkbox]"));

type RowCellsProps = {
  row: DataRow;
  columns: ColumnSpec[];
  selected: boolean;
  selectLabel: string;
  sampleLabel: string;
  /** Stable across renders (they take the row id), so the memo holds. */
  onSelect: (id: string, selected: boolean) => void;
  onOpen: (id: string) => void;
  onKey: (id: string, event: KeyboardEvent<HTMLTableRowElement>) => void;
};

/** One table row; memoised so selecting a row re-renders that row only (INP on long lists). */
const RowCells = memo(function RowCells({
  row,
  columns,
  selected,
  selectLabel,
  sampleLabel,
  onSelect,
  onOpen,
  onKey,
}: RowCellsProps) {
  return (
    <TableRow
      tabIndex={0}
      data-state={selected ? "selected" : undefined}
      aria-selected={selected}
      onClick={(event) => (fromControl(event.target) ? null : onOpen(row.id))}
      onKeyDown={(event) => onKey(row.id, event)}
      className="cursor-pointer focus-visible:bg-electric-50 focus-visible:outline-none"
    >
      <TableCell className="w-12">
        <Checkbox
          checked={selected}
          aria-label={selectLabel}
          onCheckedChange={(checked) => onSelect(row.id, checked === true)}
        />
      </TableCell>
      {columns.map((column) =>
        column.key === "name" ? (
          <TableCell key="name" className="min-w-56">
            <span className="flex items-center gap-3">
              <RowThumbnail thumb={row.thumb} name={row.title} />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {row.href ? (
                    // The name goes straight to the editor; the rest of the row opens the summary sheet.
                    <Link
                      href={row.href}
                      prefetch={false}
                      tabIndex={-1}
                      className="truncate font-semibold text-navy-900 hover:underline"
                    >
                      {row.title}
                    </Link>
                  ) : (
                    <span className="truncate font-semibold text-navy-900">{row.title}</span>
                  )}
                  {row.sample ? <Badge variant="outline">{sampleLabel}</Badge> : null}
                </span>
                {row.subtitle ? (
                  <span className="block truncate text-[13px] text-mist-600">{row.subtitle}</span>
                ) : null}
              </span>
            </span>
          </TableCell>
        ) : column.key === "status" ? (
          <TableCell key="status">
            <RowChips chips={row.chips} />
          </TableCell>
        ) : (
          <TableCell
            key={column.key}
            className={cn(
              "text-[14px]",
              column.align === "end" && "text-right",
              (row.facts[column.key]?.kind === "money" || row.facts[column.key]?.kind === "date") &&
                "tabular-nums",
              row.facts[column.key]?.kind === "muted" ? "text-mist-600" : "text-ink-900",
            )}
          >
            {row.facts[column.key]?.text ?? ""}
          </TableCell>
        ),
      )}
    </TableRow>
  );
});

type CardRowProps = Omit<RowCellsProps, "onKey">;

/** One phone card (below 768 px); memoised like the table row. */
const CardRow = memo(function CardRow({
  row,
  columns,
  selected,
  selectLabel,
  sampleLabel,
  onSelect,
  onOpen,
}: CardRowProps) {
  const facts = columns
    .filter((column) => column.key !== "name" && column.key !== "status")
    .slice(0, 2)
    .map((column) => row.facts[column.key]?.text)
    .filter(Boolean);
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Checkbox
        checked={selected}
        aria-label={selectLabel}
        onCheckedChange={(checked) => onSelect(row.id, checked === true)}
      />
      <button
        type="button"
        onClick={() => onOpen(row.id)}
        className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <RowThumbnail thumb={row.thumb} name={row.title} />
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-navy-900">{row.title}</span>
            {row.sample ? <Badge variant="outline">{sampleLabel}</Badge> : null}
          </span>
          {row.subtitle ? (
            <span className="block truncate text-[13px] text-mist-600">{row.subtitle}</span>
          ) : null}
          {facts.length > 0 ? (
            <span className="block truncate text-[13px] text-mist-600">{facts.join(" · ")}</span>
          ) : null}
          <span className="mt-1 block">
            <RowChips chips={row.chips} />
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-mist-500" />
      </button>
      {row.quick ? <div className="flex w-full flex-wrap gap-2 pl-8">{row.quick}</div> : null}
    </li>
  );
});

/**
 * The one list component (D0 R5, ADMIN.md §10): toolbar, sortable headers, selection with a bulk bar, server pages,
 * a side sheet per row, cards below 768 px, skeleton rows while the next page loads.
 */
function DataTableView({
  listKey,
  path,
  rows,
  columns,
  page,
  searchLabel,
  filters = [],
  bulk = [],
  exportHref,
  openLabel,
  empty,
}: DataTableViewProps) {
  const t = useTranslations("Admin.table");
  const router = useRouter();
  const params = useSearchParams();
  const query = useMemo(() => new URLSearchParams(params.toString()), [params]);
  const [pending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const prefs = useListPreferences(listKey);
  const hydrated = useHydrated();
  const wide = useMinWidth(768);
  const showTable = !hydrated || wide;
  const showCards = !hydrated || !wide;
  const sort = parseSort(query.get("sort"));

  const visibleColumns = useMemo(
    () => columns.filter((column) => column.always || !prefs.hidden.has(column.key)),
    [columns, prefs.hidden],
  );
  const columnVisibility: ColumnVisibilityState = Object.fromEntries(
    columns.map((column) => [column.key, column.always || !prefs.hidden.has(column.key)]),
  );
  const columnDefs = useMemo(
    () =>
      helper.columns(
        columns.map((column) =>
          helper.display({ id: column.key, header: column.label, enableHiding: !column.always }),
        ),
      ),
    [columns],
  );
  const table = useTable({
    features,
    columns: columnDefs,
    data: rows,
    getRowId: (row) => row.id,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
  });
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const open = rows.find((row) => row.id === openId) ?? null;

  const go = (changes: Record<string, string | null>) =>
    startTransition(() => {
      setRowSelection({});
      router.push(withQuery(path, query, changes), { scroll: false });
    });

  const exportRows = (subset: DataRow[]) => {
    const blob = new Blob([`﻿${rowsToCsv(subset, visibleColumns)}`], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${listKey}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const selectRow = useCallback(
    (id: string, on: boolean) => setRowSelection((current) => toggled(current, id, on)),
    [],
  );
  const openRow = useCallback((id: string) => setOpenId(id), []);
  const rowKey = useCallback((id: string, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const sibling =
        event.key === "ArrowDown"
          ? event.currentTarget.nextElementSibling
          : event.currentTarget.previousElementSibling;
      if (sibling instanceof HTMLElement) sibling.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      setOpenId(id);
    } else if (event.key === " ") {
      event.preventDefault();
      setRowSelection((current) => toggled(current, id, !current[id]));
    }
  }, []);

  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const filtered = Boolean(query.get("q")) || filters.some((filter) => query.get(filter.param));

  return (
    <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
      <DataTableToolbar
        path={path}
        query={query}
        searchLabel={searchLabel}
        filters={filters}
        columns={columns}
        hidden={prefs.hidden}
        views={prefs.views}
        exportHref={exportHref}
        pending={pending}
        onSearch={(q) => go({ q: q || null })}
        onFilter={(param, value) => go({ [param]: value })}
        onToggleColumn={prefs.toggleColumn}
        onSaveView={(name) => {
          const view = new URLSearchParams(query);
          view.delete("page");
          prefs.saveView(name, view.toString());
        }}
        onDeleteView={prefs.deleteView}
        onExport={() => exportRows(rows)}
        canExport={page.total > 0}
      />
      {selectedIds.length > 0 ? (
        <DataTableBulkBar
          ids={selectedIds}
          actions={bulk}
          onDone={() => setRowSelection({})}
          onExport={() => exportRows(rows.filter((row) => rowSelection[row.id]))}
        />
      ) : null}

      {rows.length === 0 && !pending ? (
        <AdminEmpty
          title={filtered ? t("noMatches") : empty.title}
          body={filtered ? t("noMatchesBody") : empty.body}
          {...(!filtered && empty.action ? { action: empty.action } : {})}
        />
      ) : (
        <>
          {/* Both layouts in the first HTML (CSS picks one); after hydration only the one on screen stays (INP). */}
          {showTable ? (
            <div className="hidden md:block" aria-busy={pending}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  {table.getHeaderGroups().map((group) => (
                    <TableRow key={group.id}>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            allSelected ? true : selectedIds.length > 0 ? "indeterminate" : false
                          }
                          aria-label={t("selectAll")}
                          onCheckedChange={(checked) =>
                            setRowSelection(
                              checked === true
                                ? (Object.fromEntries(
                                    rows.map((row) => [row.id, true]),
                                  ) as RowSelectionState)
                                : {},
                            )
                          }
                        />
                      </TableHead>
                      {group.headers.map((header) => {
                        const column = columns.find((item) => item.key === header.column.id);
                        if (!column) return null;
                        const active = sort?.key === column.sort ? sort : null;
                        return (
                          <TableHead
                            key={header.id}
                            aria-sort={
                              active
                                ? active.dir === "asc"
                                  ? "ascending"
                                  : "descending"
                                : undefined
                            }
                            className={column.align === "end" ? "text-right" : undefined}
                          >
                            {column.sort ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = nextSort(sort, column.sort ?? "");
                                  go({ sort: next ? `${next.key}.${next.dir}` : null });
                                }}
                                className="relative inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-semibold focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                              >
                                <table.FlexRender header={header} />
                                {active?.dir === "asc" ? (
                                  <ArrowUp aria-hidden="true" className="size-3.5" />
                                ) : active?.dir === "desc" ? (
                                  <ArrowDown aria-hidden="true" className="size-3.5" />
                                ) : (
                                  <ArrowUpDown
                                    aria-hidden="true"
                                    className="size-3.5 text-mist-400"
                                  />
                                )}
                              </button>
                            ) : (
                              <table.FlexRender header={header} />
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {pending
                    ? Array.from({ length: Math.min(rows.length || 6, 8) }, (_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell colSpan={visibleColumns.length + 1}>
                            <Skeleton className="h-10 w-full rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : table
                        .getRowModel()
                        .rows.map((row) => (
                          <RowCells
                            key={row.id}
                            row={row.original}
                            columns={visibleColumns}
                            selected={Boolean(rowSelection[row.id])}
                            selectLabel={t("selectRow", { name: row.original.title })}
                            sampleLabel={t("sample")}
                            onSelect={selectRow}
                            onOpen={openRow}
                            onKey={rowKey}
                          />
                        ))}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {showCards ? (
            <ul className="flex flex-col divide-y divide-mist-100 md:hidden" aria-busy={pending}>
              {rows.map((row) => (
                <CardRow
                  key={row.id}
                  row={row}
                  columns={visibleColumns}
                  selected={Boolean(rowSelection[row.id])}
                  selectLabel={t("selectRow", { name: row.title })}
                  sampleLabel={t("sample")}
                  onSelect={selectRow}
                  onOpen={openRow}
                />
              ))}
            </ul>
          ) : null}
        </>
      )}

      <DataTablePager
        page={page}
        pending={pending}
        onPage={(next) => go({ page: next > 1 ? String(next) : null })}
        onPageSize={(size) => go({ pageSize: size === 25 ? null : String(size) })}
      />
      <DataTableSheet
        row={open}
        onOpenChange={(next) => (next ? null : setOpenId(null))}
        openLabel={openLabel}
      />
    </div>
  );
}

export { DataTableView };
