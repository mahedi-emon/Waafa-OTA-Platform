import { describe, expect, it } from "vitest";
import { formatGrouped, formatTaka, TAKA_SIGN } from "./money";

describe("formatTaka", () => {
  it("uses the taka sign and Indian grouping", () => {
    expect(formatTaka(146480)).toBe("৳1,46,480");
    expect(formatTaka(123456)).toBe("৳1,23,456");
    expect(formatTaka(1234567)).toBe("৳12,34,567");
    expect(formatTaka(12345678)).toBe("৳1,23,45,678");
  });

  it("leaves small amounts ungrouped", () => {
    expect(formatTaka(0)).toBe("৳0");
    expect(formatTaka(999)).toBe("৳999");
    expect(formatTaka(1450)).toBe("৳1,450");
  });

  it("rounds to whole taka by default", () => {
    expect(formatTaka(1450.4)).toBe("৳1,450");
    expect(formatTaka(1450.5)).toBe("৳1,451");
  });

  it("shows paisa when asked", () => {
    expect(formatTaka(146480.5, { decimals: 2 })).toBe("৳1,46,480.50");
    expect(formatTaka(0, { decimals: 2 })).toBe("৳0.00");
  });

  it("puts the minus sign before the taka sign and never shows -৳0", () => {
    expect(formatTaka(-1200)).toBe("-৳1,200");
    expect(formatTaka(-0.2)).toBe("৳0");
  });

  it("rejects amounts that are not finite", () => {
    expect(() => formatTaka(Number.NaN)).toThrow(RangeError);
    expect(() => formatTaka(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("exports the sign as U+09F3", () => {
    expect(TAKA_SIGN.codePointAt(0)).toBe(0x09f3);
  });
});

describe("formatGrouped", () => {
  it("groups like the taka formatter without the sign", () => {
    expect(formatGrouped(146480)).toBe("1,46,480");
    expect(() => formatGrouped(Number.NaN)).toThrow(RangeError);
  });
});
