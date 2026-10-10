import type { LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * Waafa International service requests (A15): a printing quote (PRN) and a trading RFQ (TRD). Step 1 is the shared
 * contact step; step 2 is below. Messages are next-intl keys under "Services.errors" (consent under "Leads.errors").
 */

export const PRINTING_SERVICES = [
  "toner-supply",
  "printer-repair",
  "new-printers",
  "paper-supplies",
  "managed-printing",
] as const;
export const PRINTING_FREQUENCIES = ["one-off", "weekly", "monthly", "quarterly"] as const;
export const TRADING_DIRECTIONS = ["import", "export", "sourcing"] as const;
export const DELIVERY_TERMS = ["exw", "fob", "cif", "ddp", "other"] as const;

export type ProofFile = {
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
};

export const printingStepSchema = z
  .object({
    company: z.string().trim().max(120),
    service: z.enum(PRINTING_SERVICES),
    printers: z.string().trim().min(1, "printersRequired"),
    pages: z.string().trim().min(1, "pagesRequired"),
    branches: z.string().trim().min(1, "branchesRequired"),
    frequency: z.enum(PRINTING_FREQUENCIES),
    location: z.string().trim().max(120),
    models: z.string().trim().max(500),
    notes: z.string().trim().max(500),
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (values.company.length < 2) issue("company", "companyRequired");
    if (values.location.length < 2) issue("location", "locationRequired");
    if (!values.consent) issue("consent", "consentRequired");
  });

export type PrintingStepValues = z.infer<typeof printingStepSchema>;

export const tradingStepSchema = z
  .object({
    company: z.string().trim().max(120),
    direction: z.enum(TRADING_DIRECTIONS),
    product: z.string().trim().max(120),
    quantity: z.string().trim(),
    unit: z.string().trim().min(1, "unitRequired"),
    country: z.string().trim().max(60),
    specifications: z.string().trim().max(2000),
    targetPrice: z.string().trim().max(60),
    deliveryTerms: z.union([z.literal(""), z.enum(DELIVERY_TERMS)]),
    timeline: z.string().trim().min(1, "timelineRequired"),
    notes: z.string().trim().max(500),
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (values.company.length < 2) issue("company", "companyRequired");
    if (values.product.length < 2) issue("product", "productRequired");
    const quantity = Number(values.quantity.replace(/,/g, ""));
    if (!Number.isFinite(quantity) || quantity <= 0) issue("quantity", "quantityInvalid");
    if (values.country.length < 2) issue("country", "countryRequired");
    if (values.specifications.length < 3) issue("specifications", "specificationsRequired");
    if (!values.consent) issue("consent", "consentRequired");
  });

export type TradingStepValues = z.infer<typeof tradingStepSchema>;

const attachments = (file: ProofFile | null) => (file ? [{ kind: "other" as const, ...file }] : []);

/** The shared lead contract for a printing quote: the size of the job goes into `volume` as one readable line. */
export function buildPrintingLead(args: {
  contact: ContactStepValues;
  values: PrintingStepValues;
  labels: { printers: string; pages: string; branches: string; models: string };
  file: ProofFile | null;
  page: string;
}): LeadCreateInput {
  const { contact, values, labels } = args;
  const notes = [values.models && `${labels.models}: ${values.models}`, values.notes]
    .filter(Boolean)
    .join("\n");
  return {
    contact: contactToLead(contact, contact.email ? "email" : "call", ""),
    payload: {
      module: "printing",
      company: values.company.trim(),
      service: values.service,
      volume: `${labels.printers}: ${values.printers} · ${labels.pages}: ${values.pages} · ${labels.branches}: ${values.branches}`,
      frequency: values.frequency,
      location: values.location.trim(),
      attachments: attachments(args.file),
      ...(notes ? { notes } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}

/** The shared lead contract for a trading RFQ. */
export function buildTradingLead(args: {
  contact: ContactStepValues;
  values: TradingStepValues;
  file: ProofFile | null;
  page: string;
}): LeadCreateInput {
  const { contact, values } = args;
  return {
    contact: contactToLead(contact, contact.email ? "email" : "call", ""),
    payload: {
      module: "trading",
      company: values.company.trim(),
      direction: values.direction,
      country: values.country.trim(),
      product: values.product.trim(),
      specifications: values.specifications.trim(),
      quantity: Number(values.quantity.replace(/,/g, "")),
      unit: values.unit.trim(),
      ...(values.targetPrice ? { targetPrice: values.targetPrice.trim() } : {}),
      ...(values.deliveryTerms ? { deliveryTerms: values.deliveryTerms } : {}),
      timeline: values.timeline.trim(),
      attachments: attachments(args.file),
      ...(values.notes ? { notes: values.notes.trim() } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
