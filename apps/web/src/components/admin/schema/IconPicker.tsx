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
import { wordFilter } from "@/lib/admin/commandFilter";
import { humanize } from "@/lib/admin/format";

const NAMES = Object.keys(MENU_ICONS).sort();

type IconPickerProps = {
  id: string;
  value: string | undefined;
  onChange: (name: string) => void;
  describedBy?: string | undefined;
  invalid?: boolean;
  /** When the list closes (the editor marks the field as visited). */
  onClose?: () => void;
};

/** One of the icons the site can draw, picked by look or by name (the editor's icon field and the menu builder). */
function IconPicker({
  id,
  value,
  onChange,
  describedBy,
  invalid = false,
  onClose,
}: IconPickerProps) {
  const t = useTranslations("Admin.editor.widgets.icon");
  const [open, setOpen] = useState(false);
  const current = value || undefined;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClose?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : undefined}
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
        <Command filter={wordFilter}>
          <CommandInput placeholder={t("search")} />
          <CommandList className="max-h-80">
            <CommandEmpty>{t("none")}</CommandEmpty>
            <CommandGroup className="[&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:grid-cols-2 [&_[cmdk-group-items]]:gap-1">
              {NAMES.map((name) => (
                <CommandItem
                  key={name}
                  value={name.replace(/-/g, " ")}
                  onSelect={() => {
                    onChange(name);
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
  );
}

export { IconPicker };
