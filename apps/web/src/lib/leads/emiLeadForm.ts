import type { LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * "Request an EMI plan" (PRD §11 EMI page, issue 233): the amount, the months, the card's bank and what it is for →
 * EMI reference. Messages are keys under "Emi.request.errors" or "Leads.errors".
 */

/** The bank is chosen from the partner list, or "unsure" when the visitor doesn't know which cards qualify. */
export const EMI_BANK_UNSURE = "unsure";

export function emiRequestSchema(minimum: number) {
  return z
    .object({
      amount: z.string(),
      tenureMonths: z.string(),
      bank: z.string(),
      notes: z.string().max(500),
      consent: z.boolean(),
    })
    .superRefine((values, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: "custom", message, path: [path] });
      const amount = Number(values.amount.replace(/[,\s৳]/g, ""));
      if (!Number.isInteger(amount) || amount <= 0) issue("amount", "amountRequired");
      else if (amount < minimum) issue("amount", "amountBelowMinimum");
      if (!/^\d{1,2}$/.test(values.tenureMonths)) issue("tenureMonths", "monthsRequired");
      if (!values.bank) issue("bank", "bankRequired");
      if (!values.consent) issue("consent", "consentRequired");
    });
}

export type EmiRequestValues = z.infer<ReturnType<typeof emiRequestSchema>>;

export function buildEmiLead(args: {
  contact: ContactStepValues;
  values: EmiRequestValues;
  /** The bank's name as shown, or the words for "not sure" (stored as the lead's bank). */
  bankName: string;
  page: string;
}): LeadCreateInput {
  const { contact, values } = args;
  const notes = values.notes.trim();
  return {
    contact: contactToLead(contact, contact.email ? "email" : "call", ""),
    payload: {
      module: "emi",
      bank: args.bankName.slice(0, 80),
      amount: Number(values.amount.replace(/[,\s৳]/g, "")),
      tenureMonths: Number(values.tenureMonths),
      ...(notes ? { notes } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
