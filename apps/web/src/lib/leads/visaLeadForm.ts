import { VisaTypeKeySchema, daysBetween, type LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { VISA_FILE_TYPES } from "@/lib/visa/visaFiles";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * Visa application step 2 (VisaApply boards, FR-VISA-03): visa type, travel date, applicants, documents for
 * applicant 1, an optional office visit, notes and consent. Messages are keys under "Visa.errors" or "Leads.errors".
 */

/** Document slots for applicant 1 (VisaApply-2); "work-proof" is sent as kind "other". */
export const DOCUMENT_SLOTS = ["passport-bio", "photo", "bank-statement", "work-proof"] as const;
export type DocumentSlot = (typeof DOCUMENT_SLOTS)[number];
export const MAX_VISA_APPLICANTS = 10;

const DocumentSchema = z
  .object({
    slot: z.enum(DOCUMENT_SLOTS),
    fileName: z.string().min(1).max(120),
    mimeType: z.enum(VISA_FILE_TYPES),
    sizeBytes: z.number().int().positive(),
  })
  .strict();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `today` is the Asia/Dhaka date (client); travel must be today or later, a visit before travel. */
export function visaFileSchema(today: string) {
  return z
    .object({
      visaType: VisaTypeKeySchema,
      travelDate: z.string(),
      applicants: z.number().int().min(1).max(MAX_VISA_APPLICANTS),
      documents: z.array(DocumentSchema).max(DOCUMENT_SLOTS.length),
      visit: z.boolean(),
      appointmentDate: z.string(),
      appointmentWindow: z.enum(["morning", "afternoon"]),
      notes: z.string().max(1000),
      consent: z.boolean(),
    })
    .superRefine((values, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: "custom", message, path: [path] });
      if (!ISO_DATE.test(values.travelDate)) issue("travelDate", "travelDateRequired");
      else if (daysBetween(today, values.travelDate) < 0) issue("travelDate", "travelDatePast");
      if (values.visit) {
        if (!ISO_DATE.test(values.appointmentDate)) issue("appointmentDate", "visitDayRequired");
        else if (
          ISO_DATE.test(values.travelDate) &&
          daysBetween(values.appointmentDate, values.travelDate) < 0
        ) {
          issue("appointmentDate", "visitAfterTravel");
        }
      }
      if (!values.consent) issue("consent", "consentRequired");
    });
}

export type VisaFileInput = z.input<ReturnType<typeof visaFileSchema>>;
export type VisaFileValues = z.output<ReturnType<typeof visaFileSchema>>;

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

/** Fees for the summary: per applicant times applicants; an unknown embassy fee stays null. */
export function visaFees(
  fees: { embassyFee: number | null; serviceCharge: number },
  applicants: number,
): { embassy: number | null; service: number; total: number | null } {
  const embassy = fees.embassyFee === null ? null : fees.embassyFee * applicants;
  const service = fees.serviceCharge * applicants;
  return { embassy, service, total: embassy === null ? null : embassy + service };
}

export function buildVisaLead(args: {
  contact: ContactStepValues;
  values: VisaFileValues;
  country: { slug: string; name: string };
  page: string;
}): LeadCreateInput {
  const { contact, values, country } = args;
  return {
    contact: contactToLead(contact, contact.email ? "email" : "call", ""),
    payload: {
      module: "visa",
      countrySlug: country.slug,
      countryName: country.name,
      visaType: values.visaType,
      applicants: values.applicants,
      travelDate: values.travelDate,
      ...(values.visit
        ? { appointmentDate: values.appointmentDate, appointmentWindow: values.appointmentWindow }
        : {}),
      documents: values.documents.map((document) => ({
        kind: document.slot === "work-proof" ? "other" : document.slot,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
      })),
      ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
