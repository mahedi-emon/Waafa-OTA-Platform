import { describe, expect, it } from "vitest";
import { dhakaFieldToIso, dueFor } from "./reminderTimes";

describe("reminder times (issue 243)", () => {
  const now = new Date("2026-11-01T16:30:00Z"); // 22:30 in Dhaka

  it("counts quick picks from now, and tomorrow morning at 10:00 in Dhaka", () => {
    expect(dueFor("inHour", now)).toBe("2026-11-01T17:30:00.000Z");
    expect(dueFor("inThreeHours", now)).toBe("2026-11-01T19:30:00.000Z");
    expect(dueFor("tomorrowMorning", now)).toBe("2026-11-02T04:00:00.000Z");
    // 01:00 in Dhaka is already the next day there: tomorrow is the day after.
    expect(dueFor("tomorrowMorning", new Date("2026-11-01T19:00:00Z"))).toBe(
      "2026-11-03T04:00:00.000Z",
    );
  });

  it("reads the custom field as Dhaka time", () => {
    expect(dhakaFieldToIso("2026-11-02T15:30")).toBe("2026-11-02T15:30:00+06:00");
    expect(dhakaFieldToIso("not a time")).toBeNull();
  });
});
