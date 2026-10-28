import "server-only";
import { canEditContentKey } from "@waafa/shared";
import { getIntegrations } from "@/lib/data/integrations";
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
  const [integrations, contact, payments, inbox] = await Promise.all([
    hasRole(staff, "super-admin") ? getIntegrations() : undefined,
    can("contactSettings") ? read("contactSettings") : undefined,
    can("paymentSettings") ? read("paymentSettings") : undefined,
    adminGet<InboxCounts>("/admin/inbox").catch(() => null),
  ]);
  const facts: SetupFacts = {
    ...(integrations
      ? {
          integrations: {
            searchConsole: Boolean(integrations.public.googleVerification),
            analytics: Boolean(integrations.public.ga4Id || integrations.public.gtmId),
            turnstile: Boolean(integrations.public.turnstileSiteKey),
          },
        }
      : {}),
    ...(contact ? { contactUpdatedBy: contact.updatedBy ?? null } : {}),
    ...(payments !== undefined
      ? { payments: (payments?.value ?? null) as SetupFacts["payments"] }
      : {}),
    ...(typeof inbox?.counts.sampleLeft === "number"
      ? { sampleLeft: inbox.counts.sampleLeft }
      : {}),
  };
  return setupSteps(facts);
}
