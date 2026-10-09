import { describe, expect, it } from "vitest";
import { formatClock, getOfficeStatus } from "./officeHours";
import { formatBdPhone, toBdE164, whatsappLink } from "./phone";
import { makeReference, parseReference, toDhakaDateString, toDhakaIsoString } from "./reference";

const OFFICE = { opensAt: 600, closesAt: 1080, days: [6, 0, 1, 2, 3, 4] }; // Sat–Thu, 10 am–6 pm

/** Builds a UTC instant from a Dhaka wall-clock time (UTC+6). */
function dhaka(iso: string): Date {
  return new Date(`${iso}+06:00`);
}

describe("makeReference / parseReference", () => {
  it("formats prefix, Dhaka date and a 4-digit sequence", () => {
    expect(makeReference("FLT", dhaka("2026-10-08T14:00:00"), 42)).toBe("FLT-261008-0042");
  });

  it("uses the Dhaka date, not UTC", () => {
    // 21:00 UTC on 7 Oct is 03:00 on 8 Oct in Dhaka.
    expect(makeReference("PKG", new Date("2026-10-07T21:00:00Z"), 21)).toBe("PKG-261008-0021");
  });

  it("rejects bad prefixes and sequences", () => {
    expect(() => makeReference("FL", new Date(), 1)).toThrow(RangeError);
    expect(() => makeReference("FLT", new Date(), 0)).toThrow(RangeError);
    expect(() => makeReference("FLT", new Date(), 10000)).toThrow(RangeError);
  });

  it("round-trips and tolerates lowercase input", () => {
    expect(parseReference("flt-261008-0042")).toEqual({
      prefix: "FLT",
      date: "2026-10-08",
      sequence: 42,
    });
    expect(parseReference("ORD-261313-0001")).toBeNull();
    expect(parseReference("hello")).toBeNull();
  });
});

describe("Dhaka timestamps", () => {
  it("formats a moment as a +06:00 ISO timestamp and a Dhaka calendar date", () => {
    const lateUtc = new Date("2026-10-07T21:30:15Z");
    expect(toDhakaIsoString(lateUtc)).toBe("2026-10-08T03:30:15+06:00");
    expect(toDhakaDateString(lateUtc)).toBe("2026-10-08");
    expect(new Date(toDhakaIsoString(lateUtc)).getTime()).toBe(lateUtc.getTime());
  });
});

describe("Bangladeshi phone numbers", () => {
  it("normalises common ways of typing a mobile number", () => {
    for (const input of [
      "01823-232241",
      "01823232241",
      "1823 232241",
      "+880 1823-232241",
      "8801823232241",
    ]) {
      expect(toBdE164(input)).toBe("+8801823232241");
    }
  });

  it("rejects numbers that are not BD mobiles", () => {
    expect(toBdE164("01223232241")).toBeNull();
    expect(toBdE164("0182323224")).toBeNull();
    expect(toBdE164("+44 20 7946 0958")).toBeNull();
  });

  it("formats for display and builds WhatsApp links", () => {
    expect(formatBdPhone("+8801823232241")).toBe("01823-232241");
    expect(formatBdPhone("+442079460958")).toBe("+442079460958");
    expect(whatsappLink("+8801823232241", "Ref FLT-261008-0042")).toBe(
      "https://wa.me/8801823232241?text=Ref%20FLT-261008-0042",
    );
  });
});

describe("office hours chip (Asia/Dhaka)", () => {
  it("formats clock times", () => {
    expect(formatClock(600)).toBe("10 am");
    expect(formatClock(1080)).toBe("6 pm");
    expect(formatClock(630)).toBe("10:30 am");
    expect(formatClock(720)).toBe("12 pm");
  });

  it("is open on a working day during hours", () => {
    expect(getOfficeStatus(OFFICE, dhaka("2026-10-10T11:15:00"))).toEqual({
      open: true,
      label: "Open now · until 6 pm",
    });
  });

  it("says when it opens later today", () => {
    expect(getOfficeStatus(OFFICE, dhaka("2026-10-10T08:30:00")).label).toBe(
      "Closed · opens at 10 am",
    );
  });

  it("says tomorrow after closing on a working day", () => {
    expect(getOfficeStatus(OFFICE, dhaka("2026-10-11T19:00:00")).label).toBe(
      "Closed · opens tomorrow at 10 am",
    );
  });

  it("skips Friday: Thursday evening opens Saturday", () => {
    // 15 Oct 2026 is a Thursday.
    expect(getOfficeStatus(OFFICE, dhaka("2026-10-15T18:30:00")).label).toBe(
      "Closed · opens Saturday at 10 am",
    );
    expect(getOfficeStatus(OFFICE, dhaka("2026-10-16T12:00:00")).label).toBe(
      "Closed · opens tomorrow at 10 am",
    );
  });
});
