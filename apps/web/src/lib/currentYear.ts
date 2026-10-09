import { cacheLife } from "next/cache";

/**
 * The calendar year in Asia/Dhaka for "© 2026 …" (FR-FTR-06). Cached for a day, so prerendered pages may read the
 * clock (Cache Components) and the footer rolls over on 1 January Dhaka time, not UTC.
 */
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", year: "numeric" }).format(
    new Date(),
  );
  return Number(year);
}
