import { z } from "zod";
import { IsoDateSchema, IsoDateTimeSchema, TakaSchema } from "./common";

/*
 * What the admin's buttons send (D0 R4): each step names what it needs, and the API turns it into a status with the
 * rules in `packages/shared/src/workflow/`. A status is never sent on its own.
 */

const reason = z.string().trim().min(3, "Say why in a few words").max(300);

/** A content button: the status, publish time and live-since stamp come from the API. */
export const ContentActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("saveDraft") }).strict(),
  z.object({ type: z.literal("publish") }).strict(),
  z.object({ type: z.literal("schedule"), at: IsoDateTimeSchema }).strict(),
  z.object({ type: z.literal("update") }).strict(),
  z.object({ type: z.literal("unpublish") }).strict(),
  z.object({ type: z.literal("archive") }).strict(),
  z.object({ type: z.literal("restore") }).strict(),
]);

export const LeadActionInputSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("contact"),
      channel: z.enum(["call", "whatsapp", "email", "note"]),
      note: z.string().trim().min(1).max(1000).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("quote"),
      amount: TakaSchema.positive().optional(),
      note: z.string().trim().min(1).max(1000).optional(),
    })
    .strict(),
  z
    .object({ type: z.literal("askDocuments"), note: z.string().trim().max(1000).optional() })
    .strict(),
  z
    .object({ type: z.literal("askPayment"), note: z.string().trim().max(1000).optional() })
    .strict(),
  z.object({ type: z.literal("customerReplied") }).strict(),
  z.object({ type: z.literal("convert"), amount: TakaSchema.positive() }).strict(),
  z.object({ type: z.literal("close"), outcome: z.enum(["lost", "cancelled"]), reason }).strict(),
  z.object({ type: z.literal("markSpam") }).strict(),
  z.object({ type: z.literal("reopen"), reason }).strict(),
]);

/** Visa applications (ADMIN.md §8.3): the checklist, the submission and the outcome steps on a visa lead. */
export const VisaProgressInputSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("document"),
      item: z.string().trim().min(1).max(80),
      received: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("submit"),
      on: IsoDateSchema,
      submissionReference: z.string().trim().min(2).max(60),
    })
    .strict(),
  z.object({ type: z.literal("outcome"), outcome: z.enum(["approved", "rejected"]) }).strict(),
  z.object({ type: z.literal("passportReturned"), on: IsoDateSchema }).strict(),
]);

export const OrderActionInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("confirm"), by: z.enum(["proof", "call"]) }).strict(),
  z.object({ type: z.literal("startPacking") }).strict(),
  z
    .object({
      type: z.literal("ship"),
      courier: z.string().trim().min(2, "Name the courier").max(60),
      trackingNumber: z.string().trim().min(3, "Enter the tracking number").max(60),
    })
    .strict(),
  z.object({ type: z.literal("deliver") }).strict(),
  z.object({ type: z.literal("cancel"), reason }).strict(),
  z.object({ type: z.literal("return"), reason }).strict(),
]);

export const PaymentProofActionInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("verify") }).strict(),
  z.object({ type: z.literal("reject"), reason }).strict(),
]);

/** An old record address that now redirects to the record's new one (D0 R4); in the public snapshot. */
export const SlugRedirectSchema = z
  .object({
    collection: z.string().min(1).max(40),
    from: z.string().min(1).max(160),
    to: z.string().min(1).max(160),
  })
  .strict();

export type SlugRedirect = z.infer<typeof SlugRedirectSchema>;
export type ContentActionInput = z.infer<typeof ContentActionSchema>;
export type LeadActionInput = z.infer<typeof LeadActionInputSchema>;
export type VisaProgressInput = z.infer<typeof VisaProgressInputSchema>;
export type OrderActionInput = z.infer<typeof OrderActionInputSchema>;
export type PaymentProofActionInput = z.infer<typeof PaymentProofActionInputSchema>;
