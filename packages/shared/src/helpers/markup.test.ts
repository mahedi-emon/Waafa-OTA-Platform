import { describe, expect, it } from "vitest";
import { applyMarkup, markupAmount } from "./markup";

describe("applyMarkup (#107)", () => {
  it("adds a percentage, rounded to whole taka", () => {
    expect(applyMarkup(25_000, { type: "percentage", value: 5 })).toBe(26_250);
    expect(applyMarkup(999, { type: "percentage", value: 2.5 })).toBe(1_024);
  });

  it("adds a fixed amount", () => {
    expect(applyMarkup(46_480, { type: "fixed", value: 500 })).toBe(46_980);
  });

  it("leaves the price alone without a rule", () => {
    expect(applyMarkup(12_345, { type: "none", value: 40 })).toBe(12_345);
  });

  it("reports the markup amount", () => {
    expect(markupAmount(25_000, { type: "percentage", value: 5 })).toBe(1_250);
  });

  it("refuses negative or non-numeric prices", () => {
    expect(() => applyMarkup(-1, { type: "fixed", value: 1 })).toThrow(RangeError);
    expect(() => applyMarkup(Number.NaN, { type: "fixed", value: 1 })).toThrow(RangeError);
  });
});
