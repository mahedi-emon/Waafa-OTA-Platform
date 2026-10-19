const clock = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

/** "10:00 am" for minutes after midnight (600), as the admin writes times everywhere. */
export function timeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  return clock.format(Date.UTC(2000, 0, 1, hours, minutes % 60)).toLowerCase();
}

/** Every `step` minutes of a day as "HH:mm" values with their labels. */
export function timesOfDay(step: number): Array<{ value: string; minutes: number; label: string }> {
  const out: Array<{ value: string; minutes: number; label: string }> = [];
  for (let minutes = 0; minutes < 1440; minutes += step) {
    const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    out.push({ value, minutes, label: timeLabel(minutes) });
  }
  return out;
}
