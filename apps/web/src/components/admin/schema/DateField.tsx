"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { todayInDhaka } from "@/lib/admin/blueprints/automatic";
import { formatPlainDate } from "@/lib/admin/format";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type DateFieldProps = { path: Path; value: unknown; optional: boolean; nullable: boolean };

/** "2026-10-12" ↔ a local calendar day (dates have no time, so no time zone shifts them). */
const toDay = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};
const fromDay = (day: Date) =>
  `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

/** A calendar date shown as "12 Oct 2026", picked from a calendar with Today and Clear (Asia/Dhaka). */
function DateField({ path, value, optional, nullable }: DateFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.date");
  const [open, setOpen] = useState(false);
  const iso = typeof value === "string" ? value.slice(0, 10) : "";
  const day = iso ? toDay(iso) : undefined;
  const pick = (next: string | undefined) => {
    meta.change(next ?? (optional ? undefined : nullable ? null : ""));
    setOpen(false);
    meta.touch();
  };
  const year = new Date().getFullYear();

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={meta.id}
            type="button"
            variant="secondary"
            aria-describedby={meta.describedBy}
            aria-invalid={meta.error ? true : undefined}
            className="h-11 w-full max-w-64 justify-start gap-2 font-medium tabular-nums"
          >
            <CalendarDays aria-hidden="true" className="size-4 text-mist-500" />
            {iso ? (
              formatPlainDate(iso)
            ) : (
              <span className="font-normal text-mist-500">{t("pick")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            mode="single"
            selected={day}
            onSelect={(next) => pick(next ? fromDay(next) : undefined)}
            defaultMonth={day}
            captionLayout="dropdown"
            startMonth={new Date(year - 10, 0)}
            endMonth={new Date(year + 5, 11)}
          />
          <div className="flex justify-between gap-2 border-t border-mist-100 px-1 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => pick(todayInDhaka(new Date()))}
            >
              {t("today")}
            </Button>
            {optional || nullable ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => pick(undefined)}>
                {t("clear")}
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}

export { DateField };
