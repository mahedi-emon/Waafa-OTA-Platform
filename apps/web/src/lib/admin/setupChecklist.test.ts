import { describe, expect, it } from "vitest";
import { setupSteps } from "./setupChecklist";

describe("setupSteps", () => {
  it("ticks each step from the settings and leaves out what it can't read", () => {
    const steps = setupSteps({
      tracking: { ga4Id: "G-ABC123", searchConsoleToken: "" },
      contactUpdatedBy: "seed",
      payments: { offlineAccounts: [{ sample: true }] },
      sampleLeft: 3,
      turnstile: false,
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
    // The Site settings code counts for Search Console too.
    expect(setupSteps({ tracking: {}, siteVerification: "abc123" })[0]).toMatchObject({
      id: "searchConsole",
      done: true,
    });
    expect(setupSteps({ payments: { offlineAccounts: [] } })[0]?.done).toBe(false);
  });
});
