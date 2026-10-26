"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "cn";

type DestinationFilterProps = {
  label: string;
  filters: Array<{ value: string; label: string }>;
  /** Server-rendered cards with the tags they match. */
  items: Array<{ key: string; tags: string[]; node: ReactNode }>;
  emptyLabel: string;
};

/**
 * Destination finder filters (FR-HOME 5): chips filter the server-rendered tiles in place; "All" shows every tile.
 * Only the chip state is client-side; the cards stay server components. The chips are native radios (issue 236).
 */
function DestinationFilter({ label, filters, items, emptyLabel }: DestinationFilterProps) {
  const [filter, setFilter] = useState("all");
  const name = useId();
  const shown = filter === "all" ? items : items.filter((item) => item.tags.includes(filter));

  return (
    <div className="flex flex-col gap-5">
      <div
        role="radiogroup"
        aria-label={label}
        className="-mx-4 flex w-auto [scrollbar-width:none] justify-start gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        {filters.map((option) => (
          <label
            key={option.value}
            className={cn(
              "inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full border border-mist-200 bg-white px-4 text-[14px] font-medium text-ink-900 transition-colors",
              "hover:bg-mist-50 has-checked:border-navy-900 has-checked:bg-navy-900 has-checked:text-white has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={filter === option.value}
              onChange={() => setFilter(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
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
