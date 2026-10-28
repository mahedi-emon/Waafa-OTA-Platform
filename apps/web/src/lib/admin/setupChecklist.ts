const ADMIN = "/secure-admin-control";

export type SetupStepId =
  "searchConsole" | "analytics" | "turnstile" | "realContent" | "officeHours" | "payments";

/** One step of the setup checklist: done or not, and where to do it. */
export type SetupStep = { id: SetupStepId; done: boolean; href?: string };

/** What the checklist reads; a part this person can't read is left out (and so is its step). */
export type SetupFacts = {
  /** Outside services on in Admin › Integrations (issue 284); only the Super Admin, who sets them, gets these steps. */
  integrations?: { searchConsole: boolean; analytics: boolean; turnstile: boolean };
  /** Who last saved the contact details: "seed" until a person has checked them. */
  contactUpdatedBy?: string | null;
  payments?: { offlineAccounts?: Array<{ sample?: boolean }> } | null;
  sampleLeft?: number;
};

/**
 * The setup checklist (ADMIN.md §5.2): it ticks itself from the settings, so nobody ticks a box by hand. Steps whose
 * facts this person can't read are not shown.
 */
export function setupSteps(facts: SetupFacts): SetupStep[] {
  const steps: SetupStep[] = [];
  if (facts.integrations) {
    const href = `${ADMIN}/integrations`;
    steps.push({ id: "searchConsole", done: facts.integrations.searchConsole, href });
    steps.push({ id: "analytics", done: facts.integrations.analytics, href });
    steps.push({ id: "turnstile", done: facts.integrations.turnstile, href });
  }
  if (facts.sampleLeft !== undefined)
    steps.push({ id: "realContent", done: facts.sampleLeft === 0, href: `${ADMIN}/content` });
  if (facts.contactUpdatedBy !== undefined)
    steps.push({
      id: "officeHours",
      done: Boolean(facts.contactUpdatedBy) && !String(facts.contactUpdatedBy).startsWith("seed"),
      href: `${ADMIN}/settings/hours`,
    });
  if (facts.payments !== undefined) {
    const accounts = facts.payments?.offlineAccounts ?? [];
    steps.push({
      id: "payments",
      done: accounts.length > 0 && accounts.every((account) => account.sample !== true),
      href: `${ADMIN}/settings/payments`,
    });
  }
  return steps;
}
