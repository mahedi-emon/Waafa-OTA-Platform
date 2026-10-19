"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, ExternalLink, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ContentOption } from "@waafa/shared";
import { cn } from "cn";
import { AdminThumb } from "@/components/admin/AdminThumb";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { loadOptions, useContentOptions } from "./useContentOptions";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type ReferenceFieldProps = {
  path: Path;
  value: unknown;
  optional: boolean;
  nullable: boolean;
  multiple?: boolean;
};

/**
 * Picks records of another list by name, with their photo and status (a package's destination, a product's brand,
 * related packages). Stores the value the schema keeps (id, slug, code) or copies the parts an embedded group needs
 * (a group fare's airline). Never asks staff to type an id (ADMIN.md §6).
 */
function ReferenceField({
  path,
  value,
  optional,
  nullable,
  multiple = false,
}: ReferenceFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.reference");
  const [open, setOpen] = useState(false);
  const ref = meta.field.ref;
  const options = useContentOptions(ref?.key);
  if (!ref) return null;
  const nouns = ref.nouns;

  const valueOf = (option: ContentOption) =>
    ref.value ? (option.values[ref.value] ?? option.id) : option.id;
  const embedKey = ref.embed
    ? Object.entries(ref.embed).find(([, source]) => source === "value")?.[0]
    : undefined;
  const currentValues: string[] = multiple
    ? Array.isArray(value)
      ? value.map(String)
      : []
    : embedKey
      ? typeof (value as Record<string, unknown> | null)?.[embedKey] === "string"
        ? [String((value as Record<string, unknown>)[embedKey])]
        : []
      : typeof value === "string" && value
        ? [value]
        : [];
  const chosen = currentValues.map((current) => ({
    current,
    option: options.items.find((option) => valueOf(option) === current),
  }));

  const partsOf = (option: ContentOption, source: "value" | "title" | "image") =>
    source === "value"
      ? valueOf(option)
      : source === "title"
        ? option.title
        : option.image
          ? { src: option.image, alt: option.title }
          : undefined;

  const pick = (option: ContentOption) => {
    const picked = valueOf(option);
    if (multiple) {
      const next = currentValues.includes(picked)
        ? currentValues.filter((item) => item !== picked)
        : [...currentValues, picked];
      meta.change(next);
      return;
    }
    if (ref.embed) {
      const group: Record<string, unknown> = {};
      for (const [field, source] of Object.entries(ref.embed)) {
        const part = partsOf(option, source);
        if (part !== undefined) group[field] = part;
      }
      meta.change(group);
    } else {
      meta.change(picked);
    }
    for (const [field, source] of Object.entries(ref.fill ?? {}))
      editor.change([...path.slice(0, -1), field], partsOf(option, source));
    setOpen(false);
  };
  const clear = () => meta.change(multiple ? [] : optional ? undefined : nullable ? null : "");
  const unpick = (current: string) => meta.change(currentValues.filter((item) => item !== current));

  const badge = (option: ContentOption) =>
    option.sample ? (
      <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[11.5px] font-semibold text-warning-800">
        {t("sample")}
      </span>
    ) : option.status === "draft" ? (
      <span className="rounded-full bg-mist-100 px-2 py-0.5 text-[11.5px] font-semibold text-mist-700">
        {t("draft")}
      </span>
    ) : null;

  const single = chosen[0];
  const trigger = (
    <Button
      id={meta.id}
      type="button"
      variant="secondary"
      role="combobox"
      aria-expanded={open}
      aria-describedby={meta.describedBy}
      aria-invalid={meta.error ? true : undefined}
      className={cn(
        "h-auto min-h-11 w-full justify-between gap-3 px-3 py-1.5 text-left font-normal",
        multiple ? "max-w-xs" : "max-w-md",
      )}
    >
      {!multiple && single ? (
        <span className="flex min-w-0 items-center gap-3">
          <AdminThumb
            src={single.option?.image}
            name={single.option?.title ?? single.current}
            size="sm"
          />
          <span className="min-w-0 truncate text-[15px] font-semibold text-navy-900">
            {single.option?.title ??
              (options.status === "ready" ? t("missing", { value: single.current }) : "…")}
          </span>
          {single.option ? badge(single.option) : null}
        </span>
      ) : (
        <span className="flex items-center gap-2 text-[15px] text-mist-600">
          {multiple ? <Plus aria-hidden="true" className="size-4" /> : null}
          {t("choose", { thing: nouns.one })}
        </span>
      )}
      <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-mist-500" />
    </Button>
  );

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      actions={
        !multiple && single && (optional || nullable) ? (
          <button
            type="button"
            onClick={clear}
            className="min-h-8 cursor-pointer rounded-full px-2.5 text-[12.5px] font-semibold text-mist-600 hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {t("clear")}
          </button>
        ) : null
      }
    >
      <div className="flex min-w-0 flex-col gap-2">
        {multiple && chosen.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label={t("selected", { count: chosen.length })}>
            {chosen.map(({ current, option }) => (
              <li
                key={current}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-mist-200 bg-white py-1 pr-1 pl-1.5"
              >
                <AdminThumb
                  src={option?.image}
                  name={option?.title ?? current}
                  size="sm"
                  className="rounded-full"
                />
                <span className="text-[14px] font-medium text-navy-900">
                  {option?.title ?? current}
                </span>
                <button
                  type="button"
                  aria-label={t("clear") + ": " + (option?.title ?? current)}
                  onClick={() => unpick(current)}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full text-mist-600 hover:bg-mist-100 hover:text-danger-700 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) void loadOptions(ref.key);
            else meta.touch();
          }}
        >
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent align="start" className="w-[min(28rem,calc(100vw-2rem))] p-0">
            <Command>
              <CommandInput placeholder={t("search", { things: nouns.other })} />
              <CommandList className="max-h-80">
                {options.status === "loading" && options.items.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[14px] text-mist-600">{t("loading")}</p>
                ) : options.status === "failed" && options.items.length === 0 ? (
                  <p role="alert" className="px-3 py-6 text-center text-[14px] text-danger-700">
                    {t("failed")}
                  </p>
                ) : (
                  <CommandEmpty>{t("none", { things: nouns.other })}</CommandEmpty>
                )}
                <CommandGroup>
                  {options.items.map((option) => {
                    const on = currentValues.includes(valueOf(option));
                    return (
                      <CommandItem
                        key={option.id}
                        value={`${option.title} ${option.id}`}
                        onSelect={() => pick(option)}
                        className="min-h-12 gap-3"
                      >
                        <AdminThumb src={option.image} name={option.title} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-[14.5px] text-navy-900">
                          {option.title}
                        </span>
                        {badge(option)}
                        <Check
                          aria-hidden="true"
                          className={cn("size-4 text-brand-700", on ? "opacity-100" : "opacity-0")}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              <div className="border-t border-mist-100 p-2">
                <a
                  href={`/secure-admin-control/content/${ref.key}/new`}
                  target="_blank"
                  rel="noopener"
                  className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-[14px] font-semibold text-brand-700 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {t("create", { thing: nouns.one })}
                  <ExternalLink aria-hidden="true" className="ml-auto size-3.5 text-mist-500" />
                </a>
                <p className="px-2 pt-1 text-[12.5px] text-mist-600">{t("createHint")}</p>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </FieldShell>
  );
}

export { ReferenceField };
