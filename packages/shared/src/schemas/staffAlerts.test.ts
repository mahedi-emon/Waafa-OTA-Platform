import { describe, expect, it } from "vitest";
import { LeadModuleSchema } from "./leads";
import { STAFF_ALERT_AREAS, StaffAlertRecipientSchema } from "./settings";

describe("staff alert areas (issue 233)", () => {
  it("cover every request module, plus orders, payments, feedback and stock", () => {
    for (const module of LeadModuleSchema.options) expect(STAFF_ALERT_AREAS).toContain(module);
    expect(STAFF_ALERT_AREAS).toEqual(
      expect.arrayContaining(["orders", "payments", "feedback", "stock"]),
    );
  });

  it("need an email and at least one area", () => {
    expect(
      StaffAlertRecipientSchema.safeParse({ email: "desk@example.com", areas: [] }).success,
    ).toBe(false);
    expect(
      StaffAlertRecipientSchema.safeParse({ email: "desk@example.com", areas: ["visa"] }).success,
    ).toBe(true);
  });
});
