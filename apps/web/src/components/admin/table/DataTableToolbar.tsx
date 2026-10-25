"use client";

import { useState } from "react";
import { Bookmark, Columns3, Download, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { ColumnSpec, FilterSpec } from "./types";
import type { SavedView } from "./useListPreferences";

type DataTableToolbarProps = {
  path: string;
  query: URLSearchParams;
  searchLabel: string;
  filters: FilterSpec[];
  columns: ColumnSpec[];
  hidden: ReadonlySet<string>;
  views: SavedView[];
  exportHref?: string | undefined;
  pending: boolean;
  onSearch: (q: string) => void;
  onFilter: (param: string, value: string | null) => void;
  onToggleColumn: (key: string) => void;
  onSaveView: (name: string) => void;
  onDeleteView: (name: string) => void;
  onExport: () => void;
  /** Nothing to export on an empty list: the button stays away (D0 R10). */
  canExport?: boolean;
};

/** Search, filter chips, saved views, column settings and export for one list (ADMIN.md §10). */
function DataTableToolbar(props: DataTableToolbarProps) {
  const t = useTranslations("Admin.table");
  const q = props.query.get("q") ?? "";
  const [text, setText] = useState(q);
  // A saved view or Back changes the search in the address: the box follows it.
  const [shownQ, setShownQ] = useState(q);
  if (q !== shownQ) {
    setShownQ(q);
    setText(q);
  }
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const hideable = props.columns.filter((column) => !column.always);

  return (
    <div className="flex flex-col gap-3 border-b border-mist-100 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="relative min-w-0 flex-1 basis-60"
          onSubmit={(event) => {
            event.preventDefault();
            props.onSearch(text.trim());
          }}
        >
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
          />
          <Input
            type="search"
            value={text}
            aria-label={props.searchLabel}
            placeholder={props.searchLabel}
            onChange={(event) => {
              setText(event.target.value);
              if (event.target.value === "" && q) props.onSearch("");
            }}
            className="pl-10"
          />
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="secondary" size="md">
              <Bookmark aria-hidden="true" className="size-4" />
              {t("views")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{t("views")}</DropdownMenuLabel>
            {props.views.length === 0 ? (
              <p className="px-2 py-1.5 text-[13.5px] text-mist-600">{t("noViews")}</p>
            ) : (
              props.views.map((view) => (
                <div key={view.name} className="flex items-center gap-1">
                  <DropdownMenuItem asChild className="flex-1">
                    <Link href={view.query ? `${props.path}?${view.query}` : props.path}>
                      {view.name}
                    </Link>
                  </DropdownMenuItem>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("deleteView", { name: view.name })}
                    onClick={() => props.onDeleteView(view.name)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setNaming(true)}>{t("saveView")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {hideable.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="md">
                <Columns3 aria-hidden="true" className="size-4" />
                {t("columns")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("showColumns")}</DropdownMenuLabel>
              {hideable.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={!props.hidden.has(column.key)}
                  onCheckedChange={() => props.onToggleColumn(column.key)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {props.canExport === false ? null : props.exportHref ? (
          <Button asChild variant="secondary" size="md">
            <a href={props.exportHref}>
              <Download aria-hidden="true" className="size-4" />
              {t("export")}
            </a>
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="md" onClick={props.onExport}>
            <Download aria-hidden="true" className="size-4" />
            {t("export")}
          </Button>
        )}
      </div>

      {naming ? (
        <form
          className="flex flex-wrap items-center gap-2 rounded-xl bg-mist-50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            props.onSaveView(name.trim());
            setName("");
            setNaming(false);
          }}
        >
          <label htmlFor="view-name" className="text-[14px] font-medium text-ink-900">
            {t("viewName")}
          </label>
          <Input
            id="view-name"
            value={name}
            maxLength={40}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            className="h-11 max-w-60"
          />
          <Button type="submit" size="sm">
            {t("saveViewConfirm")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setNaming(false)}>
            {t("cancel")}
          </Button>
        </form>
      ) : null}

      {props.filters.map((filter) => {
        const current = props.query.get(filter.param);
        return (
          <div
            key={filter.param}
            role="group"
            aria-label={filter.label}
            className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 py-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            <span className="mr-1 shrink-0 text-[13px] font-semibold text-mist-600">
              {filter.label}
            </span>
            {[{ value: "", label: t("all") }, ...filter.options].map((option) => {
              const active = (current ?? "") === option.value;
              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  aria-pressed={active}
                  disabled={props.pending}
                  onClick={() => props.onFilter(filter.param, option.value || null)}
                  className={cn(
                    "relative min-h-9 shrink-0 cursor-pointer rounded-full border px-3 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-1 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-wait",
                    active
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-mist-300 bg-white text-navy-900 hover:bg-mist-100",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export { DataTableToolbar };
