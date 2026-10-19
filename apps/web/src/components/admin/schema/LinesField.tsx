"use client";

import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { SortableList } from "./SortableList";
import { useField } from "./useField";
import { useStableKeys } from "./useStableKeys";

type LinesFieldProps = { path: Path; value: unknown; optional: boolean };

/**
 * An ordered list of short sentences (inclusions, terms, address lines): one line each, Enter adds the next line,
 * drag or Move to reorder.
 */
function LinesField({ path, value, optional }: LinesFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const lines = Array.isArray(value)
    ? value.map((line) => (typeof line === "string" ? line : String(line)))
    : [];
  const stable = useStableKeys(lines.length);
  const lineId = (index: number) => `${meta.id}-line-${index}`;
  const focusLine = (index: number) =>
    requestAnimationFrame(() => document.getElementById(lineId(index))?.focus());

  const setLines = (next: string[]) =>
    meta.change(next.length === 0 && optional ? undefined : next);
  const insertAfter = (index: number) => {
    const next = [...lines];
    next.splice(index + 1, 0, "");
    stable.insert(index + 1);
    setLines(next);
    focusLine(index + 1);
  };
  const remove = (index: number) => {
    stable.remove(index);
    setLines(lines.filter((_, position) => position !== index));
    if (index > 0) focusLine(index - 1);
  };
  const move = (from: number, to: number) => {
    const next = [...lines];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved ?? "");
    stable.move(from, to);
    setLines(next);
  };

  const row = (index: number, handle: ReactNode) => (
    <div className="flex min-w-0 items-center gap-1">
      {handle ?? <span aria-hidden="true" className="w-1" />}
      <Input
        id={lineId(index)}
        value={lines[index] ?? ""}
        aria-label={t("itemN", { thing: meta.label, n: index + 1 })}
        placeholder={t("lines.placeholder")}
        onChange={(event) => {
          const next = [...lines];
          next[index] = event.target.value;
          setLines(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            insertAfter(index);
          } else if (event.key === "Backspace" && (lines[index] ?? "") === "" && lines.length > 1) {
            event.preventDefault();
            remove(index);
          }
        }}
        onBlur={meta.touch}
        className="h-11"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("removeThing", { thing: t("itemN", { thing: meta.label, n: index + 1 }) })}
        onClick={() => remove(index)}
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <div className="flex min-w-0 flex-col gap-2">
        {lines.length > 0 ? (
          <SortableList
            keys={stable.keys}
            onMove={move}
            nameOf={(index) => lines[index] || t("itemN", { thing: meta.label, n: index + 1 })}
            className="flex min-w-0 flex-col gap-1.5"
            renderItem={row}
          />
        ) : null}
        <div>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => insertAfter(lines.length - 1)}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("addItem")}
          </Button>
        </div>
      </div>
    </FieldShell>
  );
}

export { LinesField };
