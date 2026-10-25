const ADMIN = "/secure-admin-control";

export type SetupStepId =
  "searchConsole" | "analytics" | "turnstile" | "realContent" | "officeHours" | "payments";

/** One step of the setup checklist: done or not, and where to do it (Turnstile keys live on the server). */
export type SetupStep = { id: SetupStepId; done: boolean; href?: string };

/** What the checklist reads; a part this person can't read is left out (and so is its step). */
export type SetupFacts = {
  tracking?: { ga4Id?: string; searchConsoleToken?: string } | null;
  /** The Search Console code in Site settings, which the site uses before the tracking one. */
  siteVerification?: string;
  /** Who last saved the contact details: "seed" until a person has checked them. */
  contactUpdatedBy?: string | null;
  payments?: { offlineAccounts?: Array<{ sample?: boolean }> } | null;
  sampleLeft?: number;
  turnstile?: boolean;
};

const filled = (value: string | undefined) => typeof value === "string" && value.trim() !== "";

/**
 * The setup checklist (ADMIN.md §5.2): it ticks itself from the settings, so nobody ticks a box by hand. Steps whose
 * facts this person can't read are not shown.
 */
export function setupSteps(facts: SetupFacts): SetupStep[] {
  const steps: SetupStep[] = [];
  if (facts.tracking !== undefined) {
    steps.push({
      id: "searchConsole",
      done: filled(facts.siteVerification) || filled(facts.tracking?.searchConsoleToken),
      href: `${ADMIN}/settings/seo`,
    });
    steps.push({
      id: "analytics",
      done: filled(facts.tracking?.ga4Id),
      href: `${ADMIN}/settings/seo`,
    });
  }
  if (facts.turnstile !== undefined) steps.push({ id: "turnstile", done: facts.turnstile });
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
