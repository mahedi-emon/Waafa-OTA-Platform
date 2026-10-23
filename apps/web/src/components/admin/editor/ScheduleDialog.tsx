"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nowInDhaka } from "@/lib/admin/blueprints/automatic";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { fromLocalInput, toLocalInput } from "@/lib/admin/schema";
import { timesOfDay } from "@/lib/admin/time";
import { LazyCalendar as Calendar } from "../schema/LazyCalendar";

type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The time already scheduled, if any (ISO). */
  current?: string | undefined;
  pending: boolean;
  onSchedule: (at: string) => void;
};

/** Every 15 minutes, as "10:00 am". */
const TIMES = timesOfDay(15);

const toDay = (local: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(local);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};
const dayPart = (day: Date) =>
  `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;

/** Tomorrow at 10:00 am in Dhaka: a sensible first suggestion. */
function tomorrowMorning(now: Date): string {
  const today = toLocalInput(nowInDhaka(now)).slice(0, 10);
  const [year, month, day] = today.split("-").map(Number);
  const next = new Date(Date.UTC(year ?? 2026, (month ?? 1) - 1, (day ?? 1) + 1));
  return `${next.toISOString().slice(0, 10)}T10:00`;
}

/**
 * Schedule… (ADMIN.md §8.1): a day and a time in Asia/Dhaka. The record goes live by itself at that minute; until
 * then it shows as Scheduled and stays off the site.
 */
function ScheduleDialog({ open, onOpenChange, current, pending, onSchedule }: ScheduleDialogProps) {
  const t = useTranslations("Admin.editor.schedule");
  // The moment the dialog opened: today and "in the past" are read against it, so a render never reads the clock.
  const [openedAt] = useState(() => new Date());
  const [local, setLocal] = useState(() => toLocalInput(current) || tomorrowMorning(openedAt));
  const date = local.slice(0, 10);
  const time = local.slice(11, 16);
  const at = fromLocalInput(local);
  const past = Date.parse(at) <= openedAt.getTime();
  const year = openedAt.getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <Calendar
            mode="single"
            selected={toDay(date)}
            onSelect={(next) => {
              if (next) setLocal(`${dayPart(next)}T${time}`);
            }}
            defaultMonth={toDay(date)}
            disabled={{ before: toDay(toLocalInput(nowInDhaka(openedAt))) ?? openedAt }}
            startMonth={new Date(year, 0)}
            endMonth={new Date(year + 2, 11)}
            className="rounded-xl border border-mist-200"
          />
          <div className="flex w-full items-center justify-between gap-3">
            <span id="schedule-time-label" className="text-[14px] font-medium text-ink-900">
              {t("time")}
            </span>
            <Select value={time} onValueChange={(next) => setLocal(`${date}T${next}`)}>
              <SelectTrigger
                aria-labelledby="schedule-time-label"
                className="h-11 w-36 tabular-nums"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {TIMES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p
            aria-live="polite"
            className={
              past
                ? "w-full text-[14px] font-medium text-danger-700"
                : "w-full text-[14px] text-mist-700"
            }
          >
            {past ? t("past") : t("summary", { when: formatDhakaDateTime(at) })}
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            loading={pending}
            disabled={past || pending}
            onClick={() => onSchedule(at)}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ScheduleDialog };
