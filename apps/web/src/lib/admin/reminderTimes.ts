/* Reminder times (issue 243): quick picks and the custom field, in Asia/Dhaka (UTC+6 all year). */

export type QuickPick = "inHour" | "inThreeHours" | "tomorrowMorning";

const DHAKA_OFFSET_MS = 6 * 3_600_000;

/** "2026-11-01T10:00" in Dhaka wall time, for the custom field's starting value and minimum. */
export function dhakaLocal(date: Date): string {
  return new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 16);
}

/** The due time for a quick pick, as an ISO string; tomorrow morning is 10:00 in Dhaka (office opening). */
export function dueFor(when: QuickPick, now: Date): string {
  if (when === "inHour") return new Date(now.getTime() + 60 * 60_000).toISOString();
  if (when === "inThreeHours") return new Date(now.getTime() + 3 * 60 * 60_000).toISOString();
  const dhakaNow = new Date(now.getTime() + DHAKA_OFFSET_MS);
  const tomorrow = Date.UTC(
    dhakaNow.getUTCFullYear(),
    dhakaNow.getUTCMonth(),
    dhakaNow.getUTCDate() + 1,
    10,
  );
  return new Date(tomorrow - DHAKA_OFFSET_MS).toISOString();
}

/** A Dhaka wall time from the custom field ("2026-11-01T15:30") as an ISO string with the +06:00 offset. */
export function dhakaFieldToIso(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+06:00` : null;
}
