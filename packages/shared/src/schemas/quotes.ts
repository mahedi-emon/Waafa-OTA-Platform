import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

/**
 * Quotes (issue 298, PRD §6 leads P1, FR-ADM-LEAD): fare or package options with baggage and a price, valid until a
 * day, sent by email or a WhatsApp link with a branded PDF. The customer opens it by a signed link and accepts one
 * option; staff then confirm the fare and convert the lead to a booking (#242). Prices are taka, VAT included, and
 * indicative until an expert confirms them.
 */
export const QUOTE_STATUSES = ["draft", "sent", "accepted", "withdrawn"] as const;
export const QuoteStatusSchema = z.enum(QUOTE_STATUSES);
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;

export const QUOTE_CHANNELS = ["email", "whatsapp"] as const;
export const QuoteChannelSchema = z.enum(QUOTE_CHANNELS);
export type QuoteChannel = z.infer<typeof QuoteChannelSchema>;

export const QUOTE_MAX_OPTIONS = 5;

/** The quote reference: "QTN-261030-0001". */
export const QuoteReferenceSchema = z.string().regex(/^QTN-\d{6}-\d{4}$/);

/** The customer's link: the quote id and its signature, "<id>-<signature>" (a dot would read as a file name to the site's proxy). */
export const QuoteTokenSchema = z
  .string()
  .regex(/^[a-z0-9]{10,40}-[A-Za-z0-9_-]{32}$/, "Unknown quote");

export const QuoteOptionSchema = z
  .object({
    /** Stable within the quote: "o1" to "o5". */
    id: z.string().regex(/^o[1-9]$/),
    title: z.string().trim().min(3, "Give the option a title").max(120),
    /** Route, dates, airline, hotel or what the package includes. */
    details: z.string().trim().max(600).nullable(),
    baggage: z.string().trim().max(120).nullable(),
    /** Taka for everyone travelling, VAT included. */
    price: z.number().int().min(1, "Add the price").max(100_000_000),
  })
  .strict();
export type QuoteOption = z.infer<typeof QuoteOptionSchema>;

/** What staff write on a quote; option ids follow their order. */
export const QuoteInputSchema = z
  .object({
    options: z
      .array(QuoteOptionSchema.omit({ id: true }))
      .min(1, "Add at least one option")
      .max(QUOTE_MAX_OPTIONS, `Up to ${QUOTE_MAX_OPTIONS} options`),
    validUntil: z.iso.date("Pick the last day the prices hold"),
    notes: z.string().trim().max(1000).nullable(),
  })
  .strict();
export type QuoteInput = z.infer<typeof QuoteInputSchema>;

export const QuoteSendInputSchema = z.object({ channel: QuoteChannelSchema }).strict();
export type QuoteSendInput = z.infer<typeof QuoteSendInputSchema>;

export const QuoteAcceptInputSchema = z
  .object({ token: QuoteTokenSchema, optionId: z.string().regex(/^o[1-9]$/, "Pick an option") })
  .strict();
export type QuoteAcceptInput = z.infer<typeof QuoteAcceptInputSchema>;

/** The stored options with their ids: o1, o2 … in the order staff gave them. */
export function quoteOptionsOf(options: QuoteInput["options"]): QuoteOption[] {
  return options.map((option, index) => ({ ...option, id: `o${index + 1}` }));
}

/** Expired once the last valid day (Asia/Dhaka) has passed, unless already accepted or withdrawn. */
export function isQuoteExpired(status: QuoteStatus, validUntil: string, today: string): boolean {
  return (status === "draft" || status === "sent") && validUntil < today;
}

/** What the customer sees: open, accepted, expired or withdrawn. */
export const PublicQuoteStateSchema = z.enum(["open", "accepted", "expired", "withdrawn"]);
export type PublicQuoteState = z.infer<typeof PublicQuoteStateSchema>;

export function publicQuoteState(
  status: QuoteStatus,
  validUntil: string,
  today: string,
): PublicQuoteState {
  if (status === "accepted") return "accepted";
  if (status === "withdrawn") return "withdrawn";
  return isQuoteExpired(status, validUntil, today) ? "expired" : "open";
}

export const QuoteViewSchema = z
  .object({
    id: z.string(),
    reference: QuoteReferenceSchema,
    leadId: z.string(),
    leadReference: z.string(),
    leadStatus: z.string(),
    leadSummary: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
    customerEmail: z.string().nullable(),
    status: QuoteStatusSchema,
    expired: z.boolean(),
    options: z.array(QuoteOptionSchema),
    validUntil: z.iso.date(),
    notes: z.string().nullable(),
    acceptedOptionId: z.string().nullable(),
    acceptedAt: IsoDateTimeSchema.nullable(),
    sentAt: IsoDateTimeSchema.nullable(),
    sentVia: z.array(QuoteChannelSchema),
    /** The customer's page; staff copy it or send it on WhatsApp. */
    link: z.string(),
    /** wa.me link with the message, when the lead has a phone number. */
    whatsapp: z.string().nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    updatedBy: z.string().nullable(),
  })
  .strict();
export type QuoteView = z.infer<typeof QuoteViewSchema>;

/** One quote in the lead's Quotes card. */
export const QuoteSummarySchema = z
  .object({
    id: z.string(),
    reference: QuoteReferenceSchema,
    status: QuoteStatusSchema,
    expired: z.boolean(),
    validUntil: z.iso.date(),
    options: z.number().int(),
    lowest: z.number().int(),
    accepted: z.object({ title: z.string(), price: z.number().int() }).nullable(),
  })
  .strict();
export type QuoteSummary = z.infer<typeof QuoteSummarySchema>;

/** The customer's page: no phone or email, the first name only. */
export const PublicQuoteSchema = z
  .object({
    reference: QuoteReferenceSchema,
    firstName: z.string(),
    summary: z.string(),
    state: PublicQuoteStateSchema,
    options: z.array(QuoteOptionSchema),
    validUntil: z.iso.date(),
    notes: z.string().nullable(),
    acceptedOptionId: z.string().nullable(),
    acceptedAt: IsoDateTimeSchema.nullable(),
  })
  .strict();
export type PublicQuote = z.infer<typeof PublicQuoteSchema>;
