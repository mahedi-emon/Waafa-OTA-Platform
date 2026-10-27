import { visaStage, type TrackedRequest, type VisaProgressFacts } from "@waafa/shared";
import type { PrismaClient } from "../generated/prisma/client";

/*
 * A visa lead's application progress (D225), shared by the admin (Visa applications, the lead page) and the public
 * /track page (issue 240).
 */

/** What a visa lead stores about its application (D225). */
export type VisaProgress = {
  received?: string[];
  submittedOn?: string;
  submissionReference?: string;
  outcome?: "approved" | "rejected";
  decidedOn?: string;
  passportReturnedOn?: string;
};

export function progressOf(value: unknown): VisaProgress {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as VisaProgress) }
    : {};
}

/** The facts `visaStage` reads, from the checklist, the stored progress and the lead's status. */
export function visaFacts(
  checklist: string[],
  progress: VisaProgress,
  status: string,
): VisaProgressFacts {
  const received = new Set(progress.received ?? []);
  return {
    documents: checklist.map((item) => ({ required: true, received: received.has(item) })),
    submittedAt: progress.submittedOn ?? null,
    outcome: progress.outcome ?? null,
    passportReturnedAt: progress.passportReturnedOn ?? null,
    cancelled: status === "cancelled" || status === "lost",
  };
}

/** The checklist titles for a visa type of one Visa countries record (its first type when the request names none). */
export function checklistOf(country: unknown, visaType: unknown): string[] {
  const types = (country as { types?: Array<{ type?: unknown; checklist?: unknown }> } | null)
    ?.types;
  const type = types?.find((item) => item.type === visaType) ?? types?.[0];
  const items = Array.isArray(type?.checklist)
    ? (type.checklist as Array<{ title?: unknown }>)
    : [];
  return items.flatMap((item) => (typeof item.title === "string" ? [item.title] : []));
}

/** A visa lead's public progress (/track and My account, issues 240 and 278): stage, documents and dates only. */
export async function visaTrack(
  prisma: Pick<PrismaClient, "contentDocument">,
  lead: { payload: unknown; progress: unknown; status: string },
): Promise<NonNullable<TrackedRequest["visa"]>> {
  const payload = lead.payload as { countrySlug?: unknown; visaType?: unknown } | null;
  const country =
    typeof payload?.countrySlug === "string"
      ? await prisma.contentDocument.findUnique({
          where: { collection_docId: { collection: "visaCountries", docId: payload.countrySlug } },
          select: { data: true },
        })
      : null;
  const progress = progressOf(lead.progress);
  const { stage, received, required } = visaStage(
    visaFacts(checklistOf(country?.data, payload?.visaType), progress, lead.status),
  );
  return {
    stage,
    received,
    required,
    submittedOn: progress.submittedOn ?? null,
    passportReturnedOn: progress.passportReturnedOn ?? null,
  };
}
