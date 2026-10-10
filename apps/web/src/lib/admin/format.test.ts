import { describe, expect, it } from "vitest";
import {
  ageParts,
  displayPhone,
  formatDhakaDateTime,
  formatPlainDate,
  humanize,
  initialsOf,
  taka,
  whatsappHref,
} from "./format";

describe("admin formatting", () => {
  it("makes initials from one or more names", () => {
    expect(initialsOf("Arif Hossain")).toBe("AH");
    expect(initialsOf("Mahedi Hasan Emon")).toBe("ME");
    expect(initialsOf("Rina")).toBe("RI");
  });

  it("shows lead age in minutes, hours, then days", () => {
    expect(ageParts(12)).toEqual({ unit: "minutes", value: 12 });
    expect(ageParts(150)).toEqual({ unit: "hours", value: 2 });
    expect(ageParts(3 * 24 * 60)).toEqual({ unit: "days", value: 3 });
  });

  it("writes dates the PRD way in Asia/Dhaka", () => {
    expect(formatDhakaDateTime("2026-10-11T13:18:00.000Z")).toBe("11 Oct 2026, 7:18 pm");
    expect(formatPlainDate("2026-10-12")).toBe("12 Oct 2026");
    expect(formatPlainDate(null)).toBe("");
  });

  it("formats taka with lakh grouping and Bangladeshi phones", () => {
    expect(taka(146480)).toBe("৳1,46,480");
    expect(displayPhone("+8801712345678")).toBe("+880 1712-345678");
    expect(displayPhone("+971501234567")).toBe("+971501234567");
    expect(whatsappHref("+8801712345678", "Hi FLT-1")).toBe(
      "https://wa.me/8801712345678?text=Hi%20FLT-1",
    );
  });

  it("turns field names into labels", () => {
    expect(humanize("metaTitle")).toBe("Meta title");
    expect(humanize("seo")).toBe("SEO");
    expect(humanize("codLimit")).toBe("COD limit");
    expect(humanize("price-from")).toBe("Price from");
  });
});
