"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type MapFieldProps = { path: Path; value: unknown };

type ProductOption = { key?: string; label?: string; values?: Array<{ value?: string }> };

/**
 * Name and value pairs. On a product variant it offers the product's own options ("Colour: Black, Size: A4") so the
 * values always match what customers can pick; elsewhere it is a simple two-column list.
 */
function MapField({ path, value }: MapFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const pairs =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, string>)
      : {};
  const options = ((editor.value as { options?: ProductOption[] } | null)?.options ?? []).filter(
    (option): option is Required<ProductOption> =>
      typeof option.key === "string" && option.key !== "",
  );
  const set = (key: string, next: string | undefined) => {
    const copy = { ...pairs };
    if (next === undefined || next === "") delete copy[key];
    else copy[key] = next;
    meta.change(copy);
  };

  if (options.length > 0) {
    return (
      <FieldShell
        id={meta.id}
        label={meta.label}
        {...(meta.help ? { help: meta.help } : {})}
        {...(meta.error ? { error: meta.error } : {})}
        group
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <div key={option.key} className="flex flex-col gap-1.5">
              <span
                id={`${meta.id}-${option.key}`}
                className="text-[13.5px] font-semibold text-navy-900"
              >
                {option.label || option.key}
              </span>
              <Select
                value={pairs[option.key] ?? ""}
                onValueChange={(next) => set(option.key, next)}
              >
                <SelectTrigger aria-labelledby={`${meta.id}-${option.key}`} className="h-11 w-full">
                  <SelectValue placeholder={t("choose")} />
                </SelectTrigger>
                <SelectContent>
                  {(option.values ?? [])
                    .map((item) => item.value)
                    .filter((item): item is string => typeof item === "string" && item !== "")
                    .map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </FieldShell>
    );
  }

  const entries = Object.entries(pairs);
  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <div className="flex flex-col gap-2">
        {entries.map(([key, item], index) => (
          <div
            key={index}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2"
          >
            <Input
              aria-label={`${t("map.key")} ${index + 1}`}
              value={key}
              onChange={(event) => {
                const copy: Record<string, string> = {};
                for (const [name, current] of entries)
                  copy[name === key ? event.target.value : name] = current;
                meta.change(copy);
              }}
              className="h-11"
            />
            <Input
              aria-label={`${t("map.value")} ${index + 1}`}
              value={item}
              onChange={(event) => set(key, event.target.value)}
              className="h-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("removeThing", { thing: key || t("map.key") })}
              onClick={() => set(key, undefined)}
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => meta.change({ ...pairs, "": "" })}
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("map.add")}
          </Button>
        </div>
      </div>
    </FieldShell>
  );
}

export { MapField };
