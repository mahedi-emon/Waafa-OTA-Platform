"use client";

import type { ReactNode } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search, X } from "lucide-react";
import { cn } from "cn";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { highlight } from "@/lib/search/highlight";

export type PickerOption = {
  key: string;
  label: string;
  sub?: string;
  /** Right-hand code, e.g. "DXB". */
  code?: string;
  /** Left-hand mark: an icon circle or a country code. */
  mark?: ReactNode;
  selected?: boolean;
  onSelect: () => void;
};

export type PickerOptionGroup = { key: string; label?: string; options: PickerOption[] };

type OptionListProps = {
  /** Accessible name of the list (the picker title). */
  label: string;
  groups: PickerOptionGroup[];
  query?: string;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
  clearLabel?: string;
  /** Shown above the list (recent chips). */
  top?: ReactNode;
  /** Shown when no group has options. */
  empty?: ReactNode;
  /** Shown under the list (an error line). */
  bottom?: ReactNode;
};

/**
 * The list behind every search picker (airports, places, destinations, countries, visa types): an optional search
 * field, grouped options with the typed text in bold, arrow-key navigation (cmdk) and a designed empty state.
 */
function OptionList({
  label,
  groups,
  query,
  onQueryChange,
  placeholder,
  loading,
  clearLabel,
  top,
  empty,
  bottom,
}: OptionListProps) {
  const searchable = onQueryChange !== undefined;
  const visible = groups.filter((group) => group.options.length > 0);

  return (
    <Command
      shouldFilter={false}
      loop
      label={label}
      className="h-full min-h-0 rounded-none! bg-transparent p-0"
    >
      {searchable ? (
        <div className="px-4 pt-1 pb-3">
          <div className="flex h-12 items-center gap-2 rounded-xl border border-mist-200 bg-mist-25 px-3 transition-colors focus-within:border-electric-600 focus-within:bg-white focus-within:ring-3 focus-within:ring-ring/20">
            <Search aria-hidden="true" className="size-[18px] shrink-0 text-mist-500" />
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={onQueryChange}
              placeholder={placeholder}
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink-900 outline-none placeholder:text-mist-500"
            />
            {loading ? <Spinner className="size-4 text-mist-500" /> : null}
            {query && clearLabel ? (
              <button
                type="button"
                aria-label={clearLabel}
                onClick={() => onQueryChange?.("")}
                className="-mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-mist-500 hover:bg-mist-100 hover:text-navy-900"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {top}
      <CommandList className="max-h-none min-h-0 flex-1 overscroll-contain px-2 pb-3 lg:max-h-[min(56vh,440px)]">
        {visible.length === 0 && !loading ? empty : null}
        {visible.map((group) => (
          <CommandGroup
            key={group.key}
            heading={group.label}
            className="p-0 pb-2 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:text-[12.5px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:text-mist-600"
          >
            {group.options.map((option) => {
              const parts = highlight(option.label, query ?? "");
              return (
                <CommandItem
                  key={option.key}
                  value={option.key}
                  onSelect={option.onSelect}
                  data-checked={option.selected ? true : undefined}
                  className={cn(
                    "min-h-14 cursor-pointer gap-3 rounded-xl px-3 py-2 text-[15px]",
                    "data-[checked=true]:bg-electric-50/60 data-selected:bg-electric-50",
                    "[&>svg:last-child]:size-[18px] [&>svg:last-child]:text-electric-600",
                  )}
                >
                  {option.mark}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-ink-900">
                      {parts.before}
                      {parts.match ? (
                        <strong className="font-bold text-navy-900">{parts.match}</strong>
                      ) : null}
                      {parts.after}
                    </span>
                    {option.sub ? (
                      <span className="truncate text-[13px] text-mist-600">{option.sub}</span>
                    ) : null}
                  </span>
                  {option.code ? (
                    <span className="font-display text-[14px] font-extrabold tracking-wide text-navy-900">
                      {option.code}
                    </span>
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        {bottom}
      </CommandList>
    </Command>
  );
}

export { OptionList };
