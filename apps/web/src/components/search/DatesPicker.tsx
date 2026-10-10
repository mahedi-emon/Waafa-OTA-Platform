"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { MAX_HOTEL_NIGHTS, daysBetween } from "@waafa/shared";
import { Calendar } from "@/components/ui/calendar";
import {
  addDays,
  addMonths,
  formatFieldDate,
  formatShortDate,
  isoToLocalDate,
  localDateToIso,
} from "@/lib/search/isoDate";
import { PickerFooter } from "./PickerFooter";
import { RangeBox } from "./RangeBox";
import { useSearchCard } from "./SearchCardContext";

const MAX_MONTHS = 12;
const PHONE_MIN_MONTHS = 6;

/** Whole months from the month of `from` to the month of `to` (both YYYY-MM-DD). */
function monthsFrom(from: string, to: string): number {
  const [fy = 0, fm = 0] = from.split("-").map(Number);
  const [ty = 0, tm = 0] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

type Matcher = { before: Date } | { after: Date };

/** Replaces (not merges with) the Calendar defaults for these keys, so each value is complete. */
const CALENDAR_CLASSES = {
  root: "w-full lg:w-fit",
  months: "relative flex flex-col gap-6 lg:flex-row lg:gap-8",
  month: "flex w-full flex-col gap-3",
  month_caption: "flex h-10 w-full items-center justify-start px-1 lg:justify-center lg:px-10",
  caption_label: "font-display text-[15px] font-bold text-navy-900",
  weekday: "flex-1 select-none text-[12px] font-semibold text-mist-500",
  week: "mt-1 flex w-full",
  today: "bg-transparent font-bold text-electric-600",
  range_start:
    "relative isolate z-0 rounded-l-(--cell-radius) bg-electric-50 after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-electric-50",
  range_end:
    "relative isolate z-0 rounded-r-(--cell-radius) bg-electric-50 after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-electric-50",
  range_middle:
    "isolate rounded-none before:absolute before:inset-y-0 before:-inset-x-px before:-z-10 before:origin-left before:animate-range-fill before:bg-electric-50 before:content-['']",
  disabled: "opacity-35",
  day_button: cn(
    "text-[15px] font-medium text-ink-900 before:hidden hover:bg-electric-50",
    "data-[range-middle=true]:bg-transparent data-[range-middle=true]:text-navy-900",
    "data-[range-start=true]:bg-electric-600 data-[range-start=true]:text-white data-[range-start=true]:hover:bg-brand-700",
    "data-[range-end=true]:bg-electric-600 data-[range-end=true]:text-white data-[range-end=true]:hover:bg-brand-700",
    "data-[selected-single=true]:bg-electric-600 data-[selected-single=true]:text-white data-[selected-single=true]:hover:bg-brand-700",
  ),
};

/**
 * Departure / return, multi-city dates and hotel stays (Pick-m-dates, Pick-m-range, Pick-d-dates, Pick-d-range).
 * Two months side by side on desktop, a scrolling run of months on phones; past days and stays over 30 nights
 * are disabled; the selected range fills left to right.
 */
function DatesPicker() {
  const t = useTranslations("Search");
  const { state, dispatch, isDesktop, today } = useSearchCard();
  const picker = state.picker;
  const scroller = useRef<HTMLDivElement>(null);

  // Phones: bring the chosen day into view once, when the sheet opens.
  useEffect(() => {
    if (isDesktop) return;
    scroller.current
      ?.querySelector('button[data-range-start="true"], button[data-selected-single="true"]')
      ?.scrollIntoView({ block: "center" });
  }, [isDesktop]);

  if (!picker || !today) return null;

  const stay = picker.key === "stay";
  const { flight, hotel } = state;
  const multi = !stay && flight.trip === "multi-city";
  const oneWay = !stay && flight.trip === "one-way";
  const single = oneWay || multi;
  const focusEnd = picker.focus === "end";

  let start: string | null;
  let end: string | null = null;
  let startLabel: string;
  let endLabel = "";
  let earliest = today;
  if (stay) {
    start = hotel.checkin;
    end = hotel.checkout;
    startLabel = t("fields.checkIn");
    endLabel = t("fields.checkOut");
  } else if (multi) {
    start = flight.legs[picker.leg]?.date ?? null;
    startLabel = t("legs.flight", { n: picker.leg + 1 });
    const previous = flight.legs[picker.leg - 1]?.date;
    if (previous && daysBetween(today, previous) > 0) earliest = previous;
  } else {
    start = flight.depart;
    end = flight.trip === "round-trip" ? flight.return : null;
    startLabel = t("fields.departure");
    endLabel = t("fields.return");
  }

  const disabled: Matcher[] = [{ before: isoToLocalDate(earliest) }];
  if (stay && focusEnd && start)
    disabled.push({ after: isoToLocalDate(addDays(start, MAX_HOTEL_NIGHTS)) });

  const startMonth = isoToLocalDate(`${today.slice(0, 7)}-01`);
  const endMonth = isoToLocalDate(`${addMonths(today, 11)}-01`);
  // Desktop pages two months from the selection; phones scroll a run of months from this month (never skipping
  // earlier ones) that reaches at least three months past the selection.
  const defaultMonth = isDesktop && start ? isoToLocalDate(start) : startMonth;
  const selectedOffset = start ? monthsFrom(today, start) : 0;
  const phoneMonths = Math.min(MAX_MONTHS, Math.max(PHONE_MIN_MONTHS, selectedOffset + 4));
  const onDayClick = (day: Date, modifiers: { disabled?: boolean }) => {
    if (modifiers.disabled) return;
    dispatch({ type: "pickDate", iso: localDateToIso(day) });
  };
  const shared = {
    numberOfMonths: isDesktop ? 2 : phoneMonths,
    today: isoToLocalDate(today),
    hideNavigation: !isDesktop,
    startMonth,
    endMonth,
    defaultMonth,
    disabled,
    onDayClick,
    classNames: CALENDAR_CLASSES,
    className: "bg-transparent p-0 [--cell-radius:9999px] [--cell-size:--spacing(11)]",
  };

  // Selection drawn with custom modifiers (DayPicker v10 ties `selected` to `onSelect`; the reducer owns it).
  const from = start ? isoToLocalDate(start) : undefined;
  const to = !single && end ? isoToLocalDate(end) : undefined;
  const modifiers = {
    selected: from && to ? { from, to } : from,
    range_start: to ? from : undefined,
    range_end: to,
    range_middle: from && to ? { after: from, before: to } : undefined,
  };

  let summary: string;
  let detail: string;
  if (stay) {
    summary =
      start && end
        ? t("values.nights", { count: daysBetween(start, end) })
        : t("calendar.chooseCheckout");
    detail =
      start && end
        ? `${formatShortDate(start)} – ${formatShortDate(end)}`
        : t(focusEnd ? "calendar.tapCheckout" : "calendar.tapCheckin");
  } else if (single) {
    summary = start ? formatFieldDate(start) : t("empty.chooseDate");
    detail = multi ? t("legs.flight", { n: picker.leg + 1 }) : t("calendar.oneWay");
  } else {
    summary =
      start && end
        ? `${formatShortDate(start)} – ${formatShortDate(end)}`
        : t("calendar.chooseReturn");
    detail =
      start && end
        ? t("values.nightsAway", { count: daysBetween(start, end) })
        : t("calendar.tapReturn");
  }

  return (
    <>
      <div className={cn("grid gap-2 px-4 pb-3", multi ? "grid-cols-1" : "grid-cols-2")}>
        <RangeBox
          label={startLabel}
          value={start ? formatFieldDate(start) : t("empty.chooseDate")}
          empty={!start}
          active={single || !focusEnd}
          onClick={() => dispatch({ type: "focusDate", focus: "start" })}
        />
        {multi ? null : (
          <RangeBox
            label={endLabel}
            value={
              oneWay ? t("empty.addReturn") : end ? formatFieldDate(end) : t("empty.chooseDate")
            }
            empty={oneWay || !end}
            active={!single && focusEnd}
            onClick={() =>
              dispatch(oneWay ? { type: "addReturn" } : { type: "focusDate", focus: "end" })
            }
          />
        )}
      </div>
      <div
        ref={scroller}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 lg:px-5"
      >
        <Calendar modifiers={modifiers} {...shared} />
      </div>
      <PickerFooter summary={summary} detail={detail} />
    </>
  );
}

export { DatesPicker };
