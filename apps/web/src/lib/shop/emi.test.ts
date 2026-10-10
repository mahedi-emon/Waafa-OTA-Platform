import { describe, expect, it } from "vitest";
import { EMI_MAX_AMOUNT, clampEmiAmount, emiPlan } from "./emi";

describe("emiPlan", () => {
  it("splits evenly when it can", () => {
    expect(emiPlan(60_000, 6)).toEqual({ monthly: 10_000, lastMonth: 10_000, total: 60_000 });
  });

  it("rounds instalments up and lets the last month absorb the difference", () => {
    const plan = emiPlan(100_000, 9);
    expect(plan.monthly).toBe(11_112);
    expect(plan.monthly * 8 + plan.lastMonth).toBe(100_000);
    expect(plan.lastMonth).toBeLessThanOrEqual(plan.monthly);
  });
});

describe("clampEmiAmount", () => {
  it("keeps the amount between the minimum and the calculator limit, on the step", () => {
    expect(clampEmiAmount(5_000, 20_000)).toBe(20_000);
    expect(clampEmiAmount(9_999_999, 20_000)).toBe(EMI_MAX_AMOUNT);
    expect(clampEmiAmount(45_400, 20_000)).toBe(45_000);
  });
});
