export type DayRange = { from: string; to: string };
export type RangePreset = "last7" | "last30" | "thisMonth" | "lastMonth";

const DAY_MS = 24 * 60 * 60_000;

/** A YYYY-MM-DD day `days` before (negative: after) another, in calendar days. */
export function shiftDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - days * DAY_MS).toISOString().slice(0, 10);
}

/** Today in Asia/Dhaka (UTC+6, no daylight saving) as YYYY-MM-DD. */
export function dhakaToday(now = Date.now()): string {
  return new Date(now + 6 * 60 * 60_000).toISOString().slice(0, 10);
}

/** The report presets from a given Dhaka day: last 7 and 30 days (today included), this month and last month. */
export function rangePresets(today: string): Record<RangePreset, DayRange> {
  const monthStart = `${today.slice(0, 8)}01`;
  const lastMonthEnd = shiftDay(monthStart, 1);
  return {
    last7: { from: shiftDay(today, 6), to: today },
    last30: { from: shiftDay(today, 29), to: today },
    thisMonth: { from: monthStart, to: today },
    lastMonth: { from: `${lastMonthEnd.slice(0, 8)}01`, to: lastMonthEnd },
  };
}

/** Which preset a range is, if any (so the picker can show it as chosen). */
export function presetOf(
  range: DayRange,
  presets: Record<RangePreset, DayRange>,
): RangePreset | undefined {
  return (Object.keys(presets) as RangePreset[]).find(
    (key) => presets[key].from === range.from && presets[key].to === range.to,
  );
}
