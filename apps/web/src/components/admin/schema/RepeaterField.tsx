"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { valueWords } from "@/lib/admin/blueprints/historyText";
import { childPattern, dottedOf } from "@/lib/admin/blueprints/paths";
import { defaultFor, resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { headingOf } from "@/lib/admin/blueprints/display";
import { FieldShell } from "./FieldShell";
import { SchemaField } from "./SchemaField";
import { SortableList } from "./SortableList";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";
import { useStableKeys } from "./useStableKeys";

// The upload queue loads only where a list takes photos.
const BulkPhotoDrop = dynamic(
  () => import("./BulkPhotoDrop").then((module) => module.BulkPhotoDrop),
  { ssr: false },
);

type RepeaterFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
};

/**
 * A list of groups as cards (itinerary days, prices, documents): each card shows a summary line, folds, drags into
 * order (or Move up / Move down), duplicates, and is removed with Undo (ADMIN.md §6).
 */
function RepeaterField({ path, node, value, optional }: RepeaterFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const items = Array.isArray(value) ? value : [];
  const stable = useStableKeys(items.length);
  const itemSchema = resolve(
    (Array.isArray(node.items) ? node.items[0] : node.items) ?? {},
    editor.root,
  );
  // The item's own name ("Day", "Price") when the blueprint gives one, else the list's.
  const thing = editor.blueprint.fields[childPattern(meta.pattern, "item")]?.label ?? meta.label;
  const fixed = Boolean(meta.field.fixed);
  // Photo items (a gallery album) also take several photos at once, each its own item (D0 R8).
  const bulk = meta.field.bulkPhotos;
  const max = typeof node.maxItems === "number" ? node.maxItems : Number.POSITIVE_INFINITY;
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(items.length > 4 ? [] : stable.keys),
  );

  // Itinerary days are numbered by their place in the list ("Day 2 · Istanbul old city").
  const numbered = Object.entries(editor.blueprint.fields).some(
    ([pattern, field]) => pattern.startsWith(`${meta.pattern}_`) && field.auto === "dayNumber",
  );
  const summaryOf = (item: unknown, index: number): string => {
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
    const key = meta.field.summary;
    const raw = key && record ? record[key] : typeof item === "string" ? item : undefined;
    const filled = typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "");
    // Dates, money and choices read as the site shows them ("12 Nov 2026", "৳59,900", "Twin sharing").
    const words =
      filled && key
        ? valueWords(editor.blueprint, childPattern(meta.pattern, key), raw, {
            on: t("on"),
            off: t("off"),
          })
        : filled
          ? String(raw)
          : "";
    const counter = t("itemN", { thing, n: index + 1 });
    if (!words) return counter;
    return numbered ? `${counter} · ${words}` : words;
  };

  const setList = (next: unknown[]) => editor.change(path, next);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    stable.move(from, to);
    setList(next);
  };
  const add = () => {
    // A new card opens at once, ready to fill in.
    const key = stable.insert(items.length);
    setOpen((current) => new Set(current).add(key));
    setList([...items, defaultFor(itemSchema, editor.root)]);
  };
  const duplicate = (index: number) => {
    const copy = structuredClone(items[index]) as Record<string, unknown> | unknown;
    // A copy gets its own id when the list keeps ids (the editor fills a new one on save).
    if (copy && typeof copy === "object" && "id" in (copy as object))
      (copy as { id?: unknown }).id = "";
    const next = [...items];
    next.splice(index + 1, 0, copy);
    stable.insert(index + 1);
    setList(next);
  };
  const remove = (index: number) => {
    const removed = items[index];
    const title = summaryOf(removed, index);
    stable.remove(index);
    setList(items.filter((_, position) => position !== index));
    toast(t("removed", { thing: title }), {
      action: {
        label: t("undo"),
        onClick: () => {
          stable.insert(index);
          editor.update(path, (current) => {
            const list = Array.isArray(current) ? [...current] : [];
            list.splice(Math.min(index, list.length), 0, removed);
            return list;
          });
        },
      },
    });
  };
  const toggle = (key: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** An item with a problem in it stays open, so the error and its link reach the field (ADMIN.md §9). */
  const hasProblem = (index: number) => {
    const item = dottedOf([...path, index]);
    for (const at of editor.errors.keys())
      if (at === item || at.startsWith(`${item}.`)) return true;
    return false;
  };

  const card = (index: number, handle: ReactNode) => {
    const key = stable.keys[index] ?? String(index);
    const expanded = open.has(key) || hasProblem(index);
    const bodyId = `${meta.id}-item-${index}`;
    const title = summaryOf(items[index], index);
    return (
      <div className="min-w-0 rounded-xl border border-mist-200 bg-white">
        <div className="flex min-h-12 items-center gap-1 py-1 pr-1.5 pl-1.5">
          {fixed ? <span className="w-2" /> : (handle ?? <span className="w-2" />)}
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => toggle(key)}
            className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 text-left focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-mist-500 transition-transform duration-150 motion-reduce:transition-none",
                expanded ? "rotate-0" : "-rotate-90",
              )}
            />
            <span className="min-w-0 truncate text-[14.5px] font-semibold text-navy-900">
              {title}
            </span>
            <span className="sr-only">{expanded ? t("collapse") : t("expand")}</span>
          </button>
          {fixed ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("itemActions", { thing: title })}
                >
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem disabled={index === 0} onSelect={() => move(index, index - 1)}>
                  <ArrowUp aria-hidden="true" />
                  {t("moveUp")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={index === items.length - 1}
                  onSelect={() => move(index, index + 1)}
                >
                  <ArrowDown aria-hidden="true" />
                  {t("moveDown")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={items.length >= max} onSelect={() => duplicate(index)}>
                  <Copy aria-hidden="true" />
                  {t("duplicate")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => remove(index)}>
                  <Trash2 aria-hidden="true" />
                  {t("remove")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div
          id={bodyId}
          hidden={!expanded}
          className="border-t border-mist-100 px-3 pt-3 pb-4 sm:px-4"
        >
          {expanded ? (
            <SchemaField
              schema={itemSchema}
              path={[...path, index]}
              value={items[index]}
              optional={false}
              bare
            />
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <div className="flex min-w-0 flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-mist-300 px-4 py-3 text-[14px] text-mist-600">
            {t("empty")}
          </p>
        ) : (
          <SortableList
            keys={stable.keys}
            onMove={move}
            nameOf={(index) => summaryOf(items[index], index)}
            disabled={fixed}
            className="flex min-w-0 flex-col gap-2"
            renderItem={card}
          />
        )}
        {fixed || items.length >= max ? null : (
          <div>
            <Button type="button" variant="soft" size="sm" onClick={add}>
              <Plus aria-hidden="true" className="size-4" />
              {t("add", { thing: thing.toLowerCase() })}
            </Button>
          </div>
        )}
        {bulk && !fixed ? (
          <BulkPhotoDrop
            id={`${meta.id}-photos`}
            title={headingOf(editor.blueprint, editor.value) || undefined}
            onPhoto={(photo) =>
              editor.update(path, (current) => {
                const list = Array.isArray(current) ? [...current] : [];
                if (list.length >= max) return list;
                stable.insert(list.length);
                // The id is filled in on save (itemId); the caption waits for staff.
                list.push({ ...bulk.with, [bulk.image]: photo });
                return list;
              })
            }
          />
        ) : null}
      </div>
    </FieldShell>
  );
}

export { RepeaterField };
