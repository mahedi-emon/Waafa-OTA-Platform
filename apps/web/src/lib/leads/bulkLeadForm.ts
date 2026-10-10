import type { LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { contactToLead, type ContactStepValues } from "./contactForm";

/*
 * Corporate and bulk quote (Shop-bulk, ShopProduct-bulk): company, what is needed, notes and consent → QTE reference.
 * Messages are keys under "Shop.bulk.errors" or "Leads.errors".
 */

export const bulkQuoteSchema = z
  .object({
    company: z.string(),
    items: z.string().max(1500),
    notes: z.string().max(500),
    consent: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    if (!values.company.trim()) issue("company", "companyRequired");
    if (values.items.trim().length < 3) issue("items", "itemsRequired");
    if (!values.consent) issue("consent", "consentRequired");
  });

export type BulkQuoteValues = z.infer<typeof bulkQuoteSchema>;

export function buildBulkLead(args: {
  contact: ContactStepValues;
  values: BulkQuoteValues;
  productSlug?: string;
  page: string;
}): LeadCreateInput {
  const { contact, values } = args;
  const notes = values.notes.trim();
  return {
    contact: contactToLead(contact, contact.email ? "email" : "call", ""),
    payload: {
      module: "bulk",
      company: values.company.trim(),
      items: notes ? `${values.items.trim()}\n\n${notes}` : values.items.trim(),
      ...(args.productSlug ? { productSlug: args.productSlug } : {}),
    },
    consent: true,
    source: { channel: "web", page: args.page },
  };
}
