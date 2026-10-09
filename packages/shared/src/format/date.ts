/** All dates and times on the site are shown in Bangladesh time. */
export const DHAKA_TIME_ZONE = "Asia/Dhaka";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: DHAKA_TIME_ZONE,
});

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: DHAKA_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: DHAKA_TIME_ZONE,
});

function toDate(value: Date | string | number): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Invalid date: ${String(value)}`);
  }
  return date;
}

/** `formatDate("2026-10-12")` → `"12 Oct 2026"` (Asia/Dhaka). */
export function formatDate(value: Date | string | number): string {
  return dateFormatter.format(toDate(value));
}

/** `formatDayMonth("2026-10-12")` → `"12 Oct"` (Asia/Dhaka), for compact cards and chips. */
export function formatDayMonth(value: Date | string | number): string {
  return dayMonthFormatter.format(toDate(value));
}

/** 24-hour time for fare cards: `formatTime("2026-10-14T13:40:00Z")` → `"19:40"` (Asia/Dhaka). */
export function formatTime(value: Date | string | number): string {
  return timeFormatter.format(toDate(value));
}
