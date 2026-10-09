import type { OpeningHours } from "../schemas/settings";
import { toDhakaWallClock } from "./reference";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** 600 → "10 am", 1080 → "6 pm", 630 → "10:30 am", 720 → "12 pm". */
export function formatClock(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const suffix = hours24 < 12 ? "am" : "pm";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return mins === 0
    ? `${hours12} ${suffix}`
    : `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export type OfficeStatus = {
  open: boolean;
  /** Chip text, e.g. "Open now · until 6 pm" or "Closed · opens Saturday at 10 am". */
  label: string;
};

/**
 * Live "Open now" / "Closed" chip from the admin office hours, evaluated in Asia/Dhaka (PRD §2).
 * Pass the current time; the function is pure so it can run on the server and in tests.
 */
export function getOfficeStatus(hours: OpeningHours, now: Date): OfficeStatus {
  const local = toDhakaWallClock(now);
  const today = local.getUTCDay();
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const openDays = new Set(hours.days);

  if (openDays.has(today) && minutes >= hours.opensAt && minutes < hours.closesAt) {
    return { open: true, label: `Open now · until ${formatClock(hours.closesAt)}` };
  }

  const opensAt = formatClock(hours.opensAt);
  if (openDays.has(today) && minutes < hours.opensAt) {
    return { open: false, label: `Closed · opens at ${opensAt}` };
  }

  for (let ahead = 1; ahead <= 7; ahead += 1) {
    const day = (today + ahead) % 7;
    if (openDays.has(day)) {
      const when = ahead === 1 ? "tomorrow" : DAY_NAMES[day];
      return { open: false, label: `Closed · opens ${when} at ${opensAt}` };
    }
  }
  return { open: false, label: "Closed" };
}
