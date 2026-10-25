"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/min";
import { ArrowUpToLine, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type CountriesFieldProps = { path: Path; value: unknown; optional: boolean };

const names = new Intl.DisplayNames(["en"], { type: "region" });
const nameOf = (code: string) => names.of(code) ?? code;

/**
 * Countries in order by name (issue 229): the phone picker's countries on request forms, the first one the default.
 * Staff pick countries by name from a searchable list; the saved value stays the two-letter codes.
 */
function CountriesField({ path, value, optional }: CountriesFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.countries");
  const [open, setOpen] = useState(false);
  const chosen = useMemo(() => (Array.isArray(value) ? value.map(String) : []), [value]);
  const all = useMemo(
    () =>
      getCountries()
        .map((code) => ({ code, name: nameOf(code), dial: `+${getCountryCallingCode(code)}` }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const left = all.filter((country) => !chosen.includes(country.code));

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <ol className="flex flex-col gap-1.5">
        {chosen.map((code, index) => (
          <li
            key={code}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-mist-200 bg-white pr-1 pl-3"
          >
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink-900">
              {nameOf(code)}{" "}
              <span className="text-mist-600 tabular-nums">
                ({code}){index === 0 ? ` · ${t("first")}` : ""}
              </span>
            </span>
            {index > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => meta.change([code, ...chosen.filter((item) => item !== code)])}
              >
                <ArrowUpToLine aria-hidden="true" />
                <span className="sr-only">{t("makeFirst", { country: nameOf(code) })}</span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("remove", { country: nameOf(code) })}
              disabled={chosen.length === 1}
              onClick={() => meta.change(chosen.filter((item) => item !== code))}
            >
              <X aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ol>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="secondary" size="sm" className="w-fit" onBlur={meta.touch}>
            <Plus aria-hidden="true" />
            {t("add")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(320px,calc(100vw-24px))] p-0">
          <Command>
            <CommandInput placeholder={t("search")} />
            <CommandList>
              <CommandEmpty>{t("none")}</CommandEmpty>
              {left.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code} ${country.dial}`}
                  onSelect={() => {
                    meta.change([...chosen, country.code]);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1">{country.name}</span>
                  <span className="text-mist-600 tabular-nums">{country.dial}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

export { CountriesField };
