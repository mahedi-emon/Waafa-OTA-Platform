import { toDhakaDateString } from "@waafa/shared";

/*
 * Calendar dates in search are plain "YYYY-MM-DD" strings: a departure on 22 Oct is the same day for every
 * visitor, whatever their device clock says. These helpers never shift a date through a time zone.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

function parts(iso: string): [number, number, number] {
  const [year = "0", month = "1", day = "1"] = iso.split("-");
  return [Number(year), Number(month), Number(day)];
}

function utc(iso: string): Date {
  const [year, month, day] = parts(iso);
  return new Date(Date.UTC(year, month - 1, day));
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = parts(value);
  const date = utc(value);
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** True for a travel month written as YYYY-MM. */
export function isIsoMonth(value: string): boolean {
  return ISO_MONTH.test(value);
}

/** Today's calendar date in Bangladesh. */
export function todayInDhaka(now: Date = new Date()): string {
  return toDhakaDateString(now);
}

export function addDays(iso: string, days: number): string {
  const date = utc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The "YYYY-MM" month `count` months after the month of `iso` (a date or a month). */
export function addMonths(iso: string, count: number): string {
  const [year, month] = parts(iso);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return date.toISOString().slice(0, 7);
}

/** Local-midnight Date for react-day-picker, which works in the device's zone. */
export function isoToLocalDate(iso: string): Date {
  const [year, month, day] = parts(iso);
  return new Date(year, month - 1, day);
}

export function localDateToIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const shortDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortMonthYear = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "Thu, 22 Oct", the value line of a date field. */
export function formatFieldDate(iso: string): string {
  const date = utc(iso);
  return `${shortDay.format(date)}, ${dayMonth.format(date)}`;
}

/** "Thursday", the line under a date field. */
export function formatWeekday(iso: string): string {
  return longDay.format(utc(iso));
}

/** "22 Oct", for summaries and chips. */
export function formatShortDate(iso: string): string {
  return dayMonth.format(utc(iso));
}

/** "December 2026" for a "2026-12" travel month. */
export function formatMonth(month: string): string {
  return monthYear.format(utc(`${month}-01`));
}

/** "Dec 2026" for a "2026-12" travel month. */
export function formatShortMonth(month: string): string {
  return shortMonthYear.format(utc(`${month}-01`));
}
