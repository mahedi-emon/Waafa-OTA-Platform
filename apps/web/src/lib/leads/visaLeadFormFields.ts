import type { VisaFileInput } from "./visaLeadForm";

/** Visa application document slots, limits and defaults, without zod (issue 236). */

/** Document slots for applicant 1 (VisaApply-2); "work-proof" is sent as kind "other". */
export const DOCUMENT_SLOTS = ["passport-bio", "photo", "bank-statement", "work-proof"] as const;

export const MAX_VISA_APPLICANTS = 10;

export function visaFileDefaults(args: {
  visaType: VisaFileInput["visaType"];
  applicants?: number;
}): VisaFileInput {
  return {
    visaType: args.visaType,
    travelDate: "",
    applicants: Math.min(MAX_VISA_APPLICANTS, Math.max(1, args.applicants ?? 1)),
    documents: [],
    visit: false,
    appointmentDate: "",
    appointmentWindow: "morning",
    notes: "",
    consent: false,
  };
}
