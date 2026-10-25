"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type WeekdaysFieldProps = { path: Path; value: unknown };

/** The working week in Bangladesh starts on Saturday (0 = Sunday … 6 = Saturday, as stored). */
const ORDER = [6, 0, 1, 2, 3, 4, 5] as const;

/** Days of the week as toggle chips, Saturday first. */
function WeekdaysField({ path, value }: WeekdaysFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.weekdays");
  const days = new Set(
    Array.isArray(value) ? value.filter((day): day is number => typeof day === "number") : [],
  );
  const toggle = (day: number) => {
    const next = new Set(days);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    meta.change([...next].sort((a, b) => a - b));
  };

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <ul className="flex flex-wrap gap-1.5">
        {ORDER.map((day) => {
          const on = days.has(day);
          return (
            <li key={day}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={t(`long.${day}`)}
                onClick={() => toggle(day)}
                onBlur={meta.touch}
                className={cn(
                  "flex h-11 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-xl border px-3 text-[14px] font-semibold transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  on
                    ? "border-electric-600 bg-electric-50 text-brand-700"
                    : "border-mist-300 bg-white text-mist-600 hover:border-mist-400",
                )}
              >
                {/* A tick as well as the colour, so an open day never depends on colour alone. */}
                {on ? <Check aria-hidden="true" className="size-3.5" /> : null}
                {t(`short.${day}`)}
              </button>
            </li>
          );
        })}
      </ul>
    </FieldShell>
  );
}

export { WeekdaysField };
