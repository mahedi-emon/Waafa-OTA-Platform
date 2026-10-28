import { describe, expect, it } from "vitest";
import { setupSteps } from "./setupChecklist";

describe("setupSteps", () => {
  it("ticks each step from the settings and leaves out what it can't read", () => {
    const steps = setupSteps({
      integrations: { searchConsole: false, analytics: true, turnstile: false },
      contactUpdatedBy: "seed",
      payments: { offlineAccounts: [{ sample: true }] },
      sampleLeft: 3,
    });
    expect(steps.map((step) => [step.id, step.done])).toEqual([
      ["searchConsole", false],
      ["analytics", true],
      ["turnstile", false],
      ["realContent", false],
      ["officeHours", false],
      ["payments", false],
    ]);
    expect(setupSteps({ sampleLeft: 0 })).toEqual([
      { id: "realContent", done: true, href: "/secure-admin-control/content" },
    ]);
  });

  it("counts details as checked once a person saved them, and accounts as real once none is Sample", () => {
    const steps = setupSteps({
      contactUpdatedBy: "Rafi",
      payments: { offlineAccounts: [{ sample: false }, {}] },
    });
    expect(steps.every((step) => step.done)).toBe(true);
    expect(setupSteps({ contactUpdatedBy: "seed-patch" })[0]?.done).toBe(false);
    // Outside services point at Admin › Integrations (issue 284).
    expect(
      setupSteps({ integrations: { searchConsole: true, analytics: false, turnstile: true } })[0],
    ).toEqual({ id: "searchConsole", done: true, href: "/secure-admin-control/integrations" });
    expect(setupSteps({ payments: { offlineAccounts: [] } })[0]?.done).toBe(false);
  });
});
