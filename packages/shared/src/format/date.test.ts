import { describe, expect, it } from "vitest";
import { formatDate, formatDayMonth, formatTime } from "./date";

describe("date formatting (Asia/Dhaka)", () => {
  it("formats dates as day, short month, year", () => {
    expect(formatDate("2026-10-12")).toBe("12 Oct 2026");
    expect(formatDate(new Date("2026-01-05T00:00:00+06:00"))).toBe("5 Jan 2026");
  });

  it("uses Dhaka time, not the machine's time zone", () => {
    // 20:30 UTC on 12 Oct is 02:30 on 13 Oct in Dhaka (UTC+6).
    expect(formatDate("2026-10-12T20:30:00Z")).toBe("13 Oct 2026");
    expect(formatTime("2026-10-14T13:40:00Z")).toBe("19:40");
  });

  it("formats compact day and month", () => {
    expect(formatDayMonth("2026-12-31")).toBe("31 Dec");
  });

  it("rejects invalid input", () => {
    expect(() => formatDate("not a date")).toThrow(RangeError);
  });
});
