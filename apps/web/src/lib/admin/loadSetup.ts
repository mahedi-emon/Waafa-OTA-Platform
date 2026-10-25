import "server-only";
import { canEditContentKey } from "@waafa/shared";
import { adminGet, hasRole, requireStaff } from "./adminApi";
import { setupSteps, type SetupFacts, type SetupStep } from "./setupChecklist";
import type { ContentSingleton } from "./types";

type InboxCounts = { counts: { sampleLeft?: number } };

/** The setup checklist for this person: only the steps whose settings they can read (ADMIN.md §5.2). */
export async function loadSetup(): Promise<SetupStep[]> {
  const staff = await requireStaff();
  const can = (key: Parameters<typeof canEditContentKey>[1]) => canEditContentKey(staff.roles, key);
  const read = (key: string) =>
    adminGet<ContentSingleton>(`/admin/content/${key}`).catch(() => null);
  const [tracking, site, contact, payments, inbox] = await Promise.all([
    can("trackingSettings") ? read("trackingSettings") : undefined,
    can("siteSettings") ? read("siteSettings") : undefined,
    can("contactSettings") ? read("contactSettings") : undefined,
    can("paymentSettings") ? read("paymentSettings") : undefined,
    adminGet<InboxCounts>("/admin/inbox").catch(() => null),
  ]);
  const facts: SetupFacts = {
    ...(tracking !== undefined
      ? { tracking: (tracking?.value ?? null) as SetupFacts["tracking"] }
      : {}),
    ...(typeof (site?.value as { googleSiteVerification?: unknown } | undefined)
      ?.googleSiteVerification === "string"
      ? {
          siteVerification: (site?.value as { googleSiteVerification: string })
            .googleSiteVerification,
        }
      : {}),
    ...(contact ? { contactUpdatedBy: contact.updatedBy ?? null } : {}),
    ...(payments !== undefined
      ? { payments: (payments?.value ?? null) as SetupFacts["payments"] }
      : {}),
    ...(typeof inbox?.counts.sampleLeft === "number"
      ? { sampleLeft: inbox.counts.sampleLeft }
      : {}),
    // The bot check keys live in the server's environment; managers see whether they are set.
    ...(hasRole(staff, "admin")
      ? {
          turnstile: Boolean(
            process.env.TURNSTILE_SECRET_KEY?.trim() &&
            process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
          ),
        }
      : {}),
  };
  return setupSteps(facts);
}
