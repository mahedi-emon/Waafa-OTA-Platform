import type { LeadCreateInput } from "@waafa/shared";
import { z } from "zod";
import { isPhoneCountry, toE164 } from "./phone";

/*
 * Contact page message (Contact, Contact-sent; FR-PAGE): name, mobile, topic, message and an optional email → CNT
 * reference. Messages are next-intl keys under "Contact.form.errors".
 */

export const CONTACT_TOPICS = [
  "flights",
  "packages",
  "visa",
  "shop",
  "printing",
  "trading",
  "other",
] as const;

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
    phoneCountry: z.string(),
    phone: z.string().trim().min(1, "phoneInvalid"),
    email: z.union([z.literal(""), z.string().trim().pipe(z.email("emailInvalid"))]),
    topic: z.enum(CONTACT_TOPICS),
    message: z.string().trim().min(10, "messageShort").max(2000, "messageShort"),
  })
  .superRefine((values, ctx) => {
    if (!isPhoneCountry(values.phoneCountry) || !toE164(values.phone, values.phoneCountry)) {
      ctx.addIssue({ code: "custom", message: "phoneInvalid", path: ["phone"] });
    }
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** The shared lead contract for a contact message (the server validates again). */
export function buildContactLead(values: ContactFormValues, page: string): LeadCreateInput {
  const phone = isPhoneCountry(values.phoneCountry)
    ? toE164(values.phone, values.phoneCountry)
    : null;
  return {
    contact: {
      name: values.name.trim(),
      phone: phone ?? "",
      ...(values.email ? { email: values.email.trim() } : {}),
      preferredContact: values.email ? "email" : "whatsapp",
    },
    payload: { module: "contact", topic: values.topic, message: values.message.trim() },
    consent: true,
    source: { channel: "web", page },
  };
}
