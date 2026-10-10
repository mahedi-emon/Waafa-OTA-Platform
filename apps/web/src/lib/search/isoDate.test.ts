import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatFieldDate,
  formatMonth,
  formatShortDate,
  formatShortMonth,
  formatWeekday,
  isIsoDate,
  isIsoMonth,
  isoToLocalDate,
  localDateToIso,
  todayInDhaka,
} from "./isoDate";

describe("calendar dates for search", () => {
  it("accepts only real dates and months", () => {
    expect(isIsoDate("2026-10-22")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("22-10-2026")).toBe(false);
    expect(isIsoMonth("2026-12")).toBe(true);
    expect(isIsoMonth("2026-00")).toBe(false);
  });

  it("does date maths without drifting through time zones", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addMonths("2026-11-15", 2)).toBe("2027-01");
    expect(localDateToIso(isoToLocalDate("2026-12-31"))).toBe("2026-12-31");
  });

  it("uses the Bangladesh calendar day for today", () => {
    // 19:30 UTC on 9 Oct is already 01:30 on 10 Oct in Dhaka.
    expect(todayInDhaka(new Date("2026-10-09T19:30:00Z"))).toBe("2026-10-10");
  });

  it("formats field values like the boards", () => {
    expect(formatFieldDate("2026-10-22")).toBe("Thu, 22 Oct");
    expect(formatWeekday("2026-10-22")).toBe("Thursday");
    expect(formatShortDate("2026-10-22")).toBe("22 Oct");
    expect(formatMonth("2026-12")).toBe("December 2026");
    expect(formatShortMonth("2027-01")).toBe("Jan 2027");
  });
});
