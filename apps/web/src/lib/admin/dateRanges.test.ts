import { describe, expect, it } from "vitest";
import { dhakaToday, presetOf, rangePresets, shiftDay } from "./dateRanges";

describe("report date ranges", () => {
  it("count days in Dhaka time, across month and year ends", () => {
    expect(shiftDay("2026-03-01", 1)).toBe("2026-02-28");
    expect(shiftDay("2026-12-31", -1)).toBe("2027-01-01");
    // 19:30 UTC on 24 Oct is already 25 Oct in Dhaka.
    expect(dhakaToday(Date.parse("2026-10-24T19:30:00Z"))).toBe("2026-10-25");
  });

  it("offer the last 7 and 30 days, this month and last month, and spot a chosen one", () => {
    const presets = rangePresets("2026-10-25");
    expect(presets).toEqual({
      last7: { from: "2026-10-19", to: "2026-10-25" },
      last30: { from: "2026-09-26", to: "2026-10-25" },
      thisMonth: { from: "2026-10-01", to: "2026-10-25" },
      lastMonth: { from: "2026-09-01", to: "2026-09-30" },
    });
    expect(rangePresets("2026-01-10").lastMonth).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(presetOf({ from: "2026-09-01", to: "2026-09-30" }, presets)).toBe("lastMonth");
    expect(presetOf({ from: "2026-09-02", to: "2026-09-30" }, presets)).toBeUndefined();
  });
});
