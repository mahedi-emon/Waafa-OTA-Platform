"use client";

import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type DestinationFilterProps = {
  label: string;
  filters: Array<{ value: string; label: string }>;
  /** Server-rendered cards with the tags they match. */
  items: Array<{ key: string; tags: string[]; node: ReactNode }>;
  emptyLabel: string;
};

/**
 * Destination finder filters (FR-HOME 5): chips filter the server-rendered tiles in place; "All" shows every tile.
 * Only the chip state is client-side; the cards stay server components.
 */
function DestinationFilter({ label, filters, items, emptyLabel }: DestinationFilterProps) {
  const [filter, setFilter] = useState("all");
  const shown = filter === "all" ? items : items.filter((item) => item.tags.includes(filter));

  return (
    <div className="flex flex-col gap-5">
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(value) => setFilter(value || "all")}
        aria-label={label}
        className="-mx-4 flex w-auto [scrollbar-width:none] justify-start gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        {filters.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={cn(
              "h-11 shrink-0 rounded-full border border-mist-200 bg-white px-4 text-[14px] font-medium text-ink-900",
              "hover:bg-mist-50 data-[state=on]:border-navy-900 data-[state=on]:bg-navy-900 data-[state=on]:text-white",
            )}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {shown.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
          {shown.map((item) => (
            <li key={item.key}>{item.node}</li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-mist-50 p-6 text-center text-[14px] text-mist-600">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}

export { DestinationFilter };
