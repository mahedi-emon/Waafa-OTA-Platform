"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { MENU_ICONS, MenuIcon } from "@/components/icons/MenuIcon";
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
import { humanize } from "@/lib/admin/format";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type IconFieldProps = { path: Path; value: unknown; optional: boolean };

const NAMES = Object.keys(MENU_ICONS).sort();

/** Picks one of the icons the site can draw, by look or by name (searchable). */
function IconField({ path, value, optional }: IconFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.icon");
  const [open, setOpen] = useState(false);
  const current = typeof value === "string" && value ? value : undefined;

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) meta.touch();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={meta.id}
            type="button"
            variant="secondary"
            role="combobox"
            aria-expanded={open}
            aria-describedby={meta.describedBy}
            aria-invalid={meta.error ? true : undefined}
            className="h-11 w-full max-w-64 justify-between gap-3 px-3 font-normal"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-electric-50 text-brand-700">
                <MenuIcon name={current} className="size-4.5" />
              </span>
              <span className="text-[15px] text-navy-900">
                {current ? humanize(current) : t("choose")}
              </span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-4 text-mist-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
          <Command>
            <CommandInput placeholder={t("search")} />
            <CommandList className="max-h-80">
              <CommandEmpty>{t("none")}</CommandEmpty>
              <CommandGroup className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-2 [&_[cmdk-group-items]]:gap-1">
                {NAMES.map((name) => (
                  <CommandItem
                    key={name}
                    value={name.replace(/-/g, " ")}
                    onSelect={() => {
                      meta.change(name);
                      setOpen(false);
                    }}
                    aria-selected={current === name}
                    className="min-h-11 gap-2.5"
                  >
                    <MenuIcon name={name} className="size-4.5 text-navy-900" />
                    <span className="truncate text-[13.5px]">{humanize(name)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

export { IconField };
