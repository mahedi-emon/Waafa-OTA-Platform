"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { RangePreset } from "@/lib/admin/dateRanges";

export type AdminDateRangeStrings = {
  /** Names the control, e.g. "Dates". */
  label: string;
  /** Shown when no range is chosen, e.g. "Any date". */
  any: string;
  apply: string;
  clear: string;
  /** "{from}" and "{to}" are replaced with dates like 12 Oct 2026. */
  range: string;
  presets: Record<RangePreset, string>;
  /** Calendar month buttons. */
  previous: string;
  next: string;
};

type AdminDateRangeProps = {
  from?: string | undefined;
  to?: string | undefined;
  /** Today in Dhaka (from the server), the last day that can be chosen and the base of the presets. */
  today: string;
  /** A range must always be chosen (reports); without it, Clear removes the filter (audit log). */
  required?: boolean;
  strings: AdminDateRangeStrings;
};

const plain = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1)));
};

/** The calendar and presets load the first time the picker opens (D202). */
const AdminDateRangePanel = dynamic(
  () => import("./AdminDateRangePanel").then((mod) => mod.AdminDateRangePanel),
  { loading: () => <Skeleton className="h-[340px] w-[300px] rounded-xl" /> },
);

/**
 * A themed date range for admin lists and reports (issue 229, ADMIN.md §10): one button that reads "12 Oct 2026 –
 * 25 Oct 2026", a popover with the common ranges and a calendar. The choice goes into the address (`from`, `to`), so
 * a filtered view can be shared or reopened; the page number resets.
 */
function AdminDateRange({ from, to, today, required = false, strings }: AdminDateRangeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const go = (range: { from: string; to: string } | null) => {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (range) {
      next.set("from", range.from);
      next.set("to", range.to);
    } else {
      next.delete("from");
      next.delete("to");
    }
    setOpen(false);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const label =
    from && to
      ? strings.range.replace("{from}", plain(from)).replace("{to}", plain(to))
      : strings.any;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="md" aria-label={`${strings.label}: ${label}`}>
          <CalendarRange aria-hidden="true" />
          <span className="tabular-nums">{label}</span>
          <ChevronDown aria-hidden="true" className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-24px)] p-0">
        {open ? (
          <AdminDateRangePanel
            from={from}
            to={to}
            today={today}
            required={required}
            strings={strings}
            onApply={go}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export { AdminDateRange };
