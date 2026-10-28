import { describe, expect, it } from "vitest";
import { canSeeEvent } from "./liveBus";

describe("canSeeEvent (issue 243)", () => {
  const visa = { id: "v", roles: ["visa-officer"] as const };
  const sales = { id: "s", roles: ["travel-sales"] as const };
  const accounts = { id: "a", roles: ["accounts"] as const };
  const admin = { id: "m", roles: ["admin"] as const };

  it("sends a lead only to the people who can open its service", () => {
    expect(canSeeEvent(sales, { module: "flights" })).toBe(true);
    expect(canSeeEvent(visa, { module: "flights" })).toBe(false);
    expect(canSeeEvent(visa, { module: "visa" })).toBe(true);
    expect(canSeeEvent(admin, { module: "visa" })).toBe(true);
  });

  it("sends orders and proofs by role, managers included", () => {
    expect(canSeeEvent(accounts, { roles: ["accounts"] })).toBe(true);
    expect(canSeeEvent(sales, { roles: ["accounts"] })).toBe(false);
    expect(canSeeEvent(admin, { roles: ["shop-manager", "accounts"] })).toBe(true);
  });

  it("sends a personal alert to its person only", () => {
    expect(canSeeEvent(sales, { staffId: "s" })).toBe(true);
    expect(canSeeEvent(admin, { staffId: "s" })).toBe(false);
  });
});
