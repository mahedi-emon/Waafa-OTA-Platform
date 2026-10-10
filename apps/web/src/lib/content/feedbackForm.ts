import { z } from "zod";
import { FeedbackServiceSchema, type FeedbackCreateInput } from "@waafa/shared";
import { isPhoneCountry, toE164 } from "@/lib/leads/phone";

/*
 * Public feedback form (Feedback, Feedback-sent; FR-FDB). Messages are next-intl keys under "Feedback.form.errors".
 * The rating and the photo are optional; consent decides whether a moderator may publish it.
 */

export const feedbackFormSchema = z
  .object({
    name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
    phoneCountry: z.string(),
    phone: z.string().trim().min(1, "phoneInvalid"),
    service: FeedbackServiceSchema,
    reference: z.union([
      z.literal(""),
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}-\d{6}-\d{4}$/, "referenceInvalid"),
    ]),
    /** "" for no rating, otherwise "1" to "5". */
    rating: z.enum(["", "1", "2", "3", "4", "5"]),
    comment: z.string().trim().min(10, "commentShort").max(1000, "commentShort"),
    consentToPublish: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!isPhoneCountry(values.phoneCountry) || !toE164(values.phone, values.phoneCountry)) {
      ctx.addIssue({ code: "custom", message: "phoneInvalid", path: ["phone"] });
    }
  });

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export type FeedbackPhoto = {
  fileName: string;
  mimeType: "image/jpeg" | "image/png";
  sizeBytes: number;
};

/** The shared feedback contract (the server validates again and stores it as pending). */
export function buildFeedbackInput(
  values: FeedbackFormValues,
  photo: FeedbackPhoto | null,
): FeedbackCreateInput {
  const phone = isPhoneCountry(values.phoneCountry)
    ? toE164(values.phone, values.phoneCountry)
    : null;
  return {
    name: values.name.trim(),
    phone: phone ?? "",
    service: values.service,
    ...(values.reference ? { reference: values.reference.trim().toUpperCase() } : {}),
    ...(values.rating ? { rating: Number(values.rating) } : {}),
    comment: values.comment.trim(),
    ...(photo ? { photo } : {}),
    consentToPublish: values.consentToPublish,
  };
}
