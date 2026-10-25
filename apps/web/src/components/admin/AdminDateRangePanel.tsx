"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { presetOf, rangePresets, type RangePreset } from "@/lib/admin/dateRanges";
import type { AdminDateRangeStrings } from "./AdminDateRange";

type AdminDateRangePanelProps = {
  from?: string | undefined;
  to?: string | undefined;
  today: string;
  required: boolean;
  strings: AdminDateRangeStrings;
  onApply: (range: { from: string; to: string } | null) => void;
};

/** YYYY-MM-DD ↔ a Date at UTC midnight, so the picker never shifts a day across time zones. */
const toDate = (day: string) => new Date(`${day}T00:00:00Z`);
const toDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const local = (day: string) => {
  const utc = toDate(day);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
};

/** The picker's inside: preset ranges as a list, a one-month range calendar, Clear and Show. */
function AdminDateRangePanel({
  from,
  to,
  today,
  required,
  strings,
  onApply,
}: AdminDateRangePanelProps) {
  const presets = rangePresets(today);
  const [picked, setPicked] = useState<DateRange | undefined>(
    from && to ? { from: local(from), to: local(to) } : undefined,
  );
  const chosen =
    picked?.from && picked.to
      ? presetOf({ from: toDay(picked.from), to: toDay(picked.to) }, presets)
      : undefined;
  const last = local(today);

  return (
    <div className="flex flex-col sm:flex-row">
      <ul
        aria-label={strings.label}
        className="flex flex-wrap gap-1.5 border-b border-mist-100 p-3 sm:w-40 sm:flex-col sm:border-r sm:border-b-0"
      >
        {(Object.keys(presets) as RangePreset[]).map((key) => (
          <li key={key}>
            <button
              type="button"
              aria-pressed={chosen === key}
              onClick={() => onApply(presets[key])}
              className={cn(
                "min-h-11 w-full rounded-lg px-3 text-left text-[14px] font-medium transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none",
                chosen === key ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-electric-50",
              )}
            >
              {strings.presets[key]}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 p-3">
        <Calendar
          mode="range"
          selected={picked}
          onSelect={setPicked}
          defaultMonth={picked?.from ?? last}
          disabled={{ after: last }}
          labels={{
            labelPrevious: () => strings.previous,
            labelNext: () => strings.next,
          }}
        />
        <div className="flex justify-end gap-2">
          {required ? null : (
            <Button type="button" variant="ghost" onClick={() => onApply(null)}>
              {strings.clear}
            </Button>
          )}
          <Button
            type="button"
            variant="navy"
            disabled={!picked?.from}
            onClick={() =>
              picked?.from &&
              onApply({ from: toDay(picked.from), to: toDay(picked.to ?? picked.from) })
            }
          >
            {strings.apply}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { AdminDateRangePanel };
