import { describe, expect, it } from "vitest";
import { DURATION, SPRING, STAGGER_MAX_ITEMS, staggerDelay } from "./tokens";

describe("motion tokens", () => {
  it("staggers 50 ms per item and caps after eight items", () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(1)).toBeCloseTo(0.05);
    expect(staggerDelay(7)).toBeCloseTo(0.35);
    expect(staggerDelay(8)).toBeCloseTo(0.35);
    expect(staggerDelay(40)).toBeCloseTo((STAGGER_MAX_ITEMS - 1) * 0.05);
  });

  it("treats bad indexes as the first item", () => {
    expect(staggerDelay(-3)).toBe(0);
    expect(staggerDelay(Number.NaN)).toBe(0);
  });

  it("keeps entrances within the PRD's 400-700 ms band and UI changes within 150-300 ms", () => {
    expect(DURATION.page).toBeGreaterThanOrEqual(0.4);
    expect(DURATION.reveal).toBeLessThanOrEqual(0.7);
    expect(DURATION.fast).toBe(0.15);
    expect(DURATION.slow).toBeLessThanOrEqual(0.3);
  });

  it("uses the HANDOFF springs for tabs and sheets", () => {
    expect(SPRING.tab).toMatchObject({ stiffness: 500, damping: 38 });
    expect(SPRING.sheet).toMatchObject({ stiffness: 380, damping: 34 });
  });
});
