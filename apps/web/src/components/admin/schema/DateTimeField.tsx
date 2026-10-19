"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nowInDhaka } from "@/lib/admin/blueprints/automatic";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { fromLocalInput, toLocalInput, type Path } from "@/lib/admin/schema";
import { timesOfDay } from "@/lib/admin/time";
import { FieldShell } from "./FieldShell";
import { LazyCalendar as Calendar } from "./LazyCalendar";
import { useField } from "./useField";

type DateTimeFieldProps = { path: Path; value: unknown; optional: boolean; nullable: boolean };

/** Every 15 minutes, as "10:00 am". */
const TIMES = timesOfDay(15);

const toDay = (local: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(local);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};
const dayPart = (day: Date) =>
  `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

/** A date and a time in Asia/Dhaka ("12 Oct 2026, 10:00 am"); stored with its +06:00 offset. */
function DateTimeField({ path, value, optional, nullable }: DateTimeFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.date");
  const [open, setOpen] = useState(false);
  const local = toLocalInput(value); // "2026-10-12T10:00" in Dhaka, or ""
  const date = local.slice(0, 10);
  const time = local.slice(11, 16) || "10:00";
  const day = date ? toDay(date) : undefined;
  const save = (nextDate: string, nextTime: string) =>
    meta.change(fromLocalInput(`${nextDate}T${nextTime}`));
  const clear = () => meta.change(optional ? undefined : nullable ? null : "");
  const year = new Date().getFullYear();
  const rounded = TIMES.some((option) => option.value === time) ? time : undefined;

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
    >
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={meta.id}
              type="button"
              variant="secondary"
              aria-describedby={meta.describedBy}
              aria-invalid={meta.error ? true : undefined}
              className="h-11 min-w-52 justify-start gap-2 font-medium tabular-nums"
            >
              <CalendarClock aria-hidden="true" className="size-4 text-mist-500" />
              {local ? (
                formatDhakaDateTime(fromLocalInput(local))
              ) : (
                <span className="font-normal text-mist-500">{t("pick")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <Calendar
              mode="single"
              selected={day}
              onSelect={(next) => {
                if (next) save(dayPart(next), time);
                setOpen(false);
                meta.touch();
              }}
              defaultMonth={day}
              captionLayout="dropdown"
              startMonth={new Date(year - 5, 0)}
              endMonth={new Date(year + 5, 11)}
            />
            <div className="flex justify-between gap-2 border-t border-mist-100 px-1 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  meta.change(nowInDhaka(new Date()));
                  setOpen(false);
                }}
              >
                {t("now")}
              </Button>
              {optional || nullable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clear();
                    setOpen(false);
                  }}
                >
                  {t("clear")}
                </Button>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
        {date ? (
          <Select value={rounded} onValueChange={(next) => save(date, next)}>
            <SelectTrigger
              aria-label={`${t("time")}: ${meta.label}`}
              className="h-11 w-36 tabular-nums"
            >
              <SelectValue placeholder={time} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {TIMES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </FieldShell>
  );
}

export { DateTimeField };
