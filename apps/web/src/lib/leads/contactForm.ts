import type { LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { isPhoneCountry, toE164 } from "./phone";

/*
 * Step 1 of every lead request: how the travel expert reaches the visitor. Messages are next-intl keys under
 * "Leads.errors"; the server validates again with the shared LeadContactSchema.
 */

export function contactStepSchema(emailRequired: boolean) {
  return z
    .object({
      name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
      phoneCountry: z.string().refine((code): boolean => isPhoneCountry(code), "phoneInvalid"),
      phone: z.string().trim().min(1, "phoneInvalid"),
      email: emailRequired
        ? z.string().trim().min(1, "emailRequired").pipe(z.email("emailInvalid"))
        : z.union([z.literal(""), z.string().trim().pipe(z.email("emailInvalid"))]),
    })
    .superRefine((values, ctx) => {
      if (!isPhoneCountry(values.phoneCountry) || !toE164(values.phone, values.phoneCountry)) {
        ctx.addIssue({ code: "custom", message: "phoneInvalid", path: ["phone"] });
      }
    });
}

export type ContactStepValues = z.infer<ReturnType<typeof contactStepSchema>>;

/** The contact block of the shared lead contract, with the phone in E.164. */
export function contactToLead(
  contact: ContactStepValues,
  preferredContact: LeadCreateInput["contact"]["preferredContact"],
  bestTime: string,
): LeadCreateInput["contact"] {
  const phone = isPhoneCountry(contact.phoneCountry)
    ? toE164(contact.phone, contact.phoneCountry)
    : null;
  return {
    name: contact.name.trim(),
    phone: phone ?? "",
    ...(contact.email ? { email: contact.email.trim() } : {}),
    preferredContact,
    ...(bestTime ? { bestTime } : {}),
  };
}
