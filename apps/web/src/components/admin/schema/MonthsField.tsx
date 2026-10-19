"use client";

import { Check } from "lucide-react";
import { cn } from "cn";
import { todayInDhaka } from "@/lib/admin/blueprints/automatic";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type MonthsFieldProps = { path: Path; value: unknown; optional: boolean };

/** How many months ahead staff can pick. */
const AHEAD = 18;

const label = (month: string) => {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year ?? 2026, (number ?? 1) - 1, 1)));
};

/** The next months as chips ("Nov 2026"); stored as "2026-11", in order. Months already chosen always show. */
function MonthsField({ path, value, optional }: MonthsFieldProps) {
  const meta = useField(path);
  const chosen = new Set(Array.isArray(value) ? value.map(String) : []);
  const [year, month] = todayInDhaka(new Date()).split("-").map(Number);
  const upcoming = Array.from({ length: AHEAD }, (_, index) => {
    const total = (month ?? 1) - 1 + index;
    return `${(year ?? 2026) + Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  });
  const months = [...new Set([...chosen, ...upcoming])].sort();
  const toggle = (item: string) => {
    const next = new Set(chosen);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    meta.change([...next].sort());
  };

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <ul className="flex flex-wrap gap-1.5">
        {months.map((item) => {
          const on = chosen.has(item);
          return (
            <li key={item}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(item)}
                onBlur={meta.touch}
                className={cn(
                  "relative inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[14px] tabular-nums transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-[3px] focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  on
                    ? "border-electric-600 bg-electric-50 font-semibold text-brand-700"
                    : "border-mist-300 bg-white text-ink-900 hover:border-mist-400",
                )}
              >
                {on ? <Check aria-hidden="true" className="size-3.5" /> : null}
                {label(item)}
              </button>
            </li>
          );
        })}
      </ul>
    </FieldShell>
  );
}

export { MonthsField };
