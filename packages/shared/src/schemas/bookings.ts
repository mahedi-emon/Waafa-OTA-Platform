import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

/**
 * Bookings (issue 242, FR-ADM Bookings and FR-ADM-LEAD convert): the manual record of what a converted lead bought —
 * PNR, ticket numbers, amount, payment status and the documents (e-tickets, vouchers, invoices).
 */
export const BOOKING_STATUSES = ["confirmed", "ticketed", "travelled", "cancelled"] as const;
export const BookingStatusSchema = z.enum(BOOKING_STATUSES);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded"] as const;
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

/** Airline record locators and e-ticket numbers: letters, digits and dashes. */
const CodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,20}$/, "Use letters and digits, 4 to 20");

/** What staff change on a booking; the payment status follows the amounts unless set to Refunded. */
export const BookingUpdateInputSchema = z
  .object({
    status: BookingStatusSchema.optional(),
    refunded: z.boolean().optional(),
    amount: z.number().int().min(0).max(100_000_000).optional(),
    paid: z.number().int().min(0).max(100_000_000).optional(),
    pnr: CodeSchema.nullable().optional(),
    tickets: z.array(CodeSchema).max(30).optional(),
    supplier: z.string().trim().max(80).nullable().optional(),
    travelDate: z.iso.date().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();
export type BookingUpdateInput = z.infer<typeof BookingUpdateInputSchema>;

/** Unpaid, partly paid or paid from the amounts; Refunded only when staff say so. */
export function paymentStatusOf(amount: number, paid: number, refunded = false): PaymentStatus {
  if (refunded) return "refunded";
  if (paid <= 0) return "unpaid";
  return paid >= amount ? "paid" : "partial";
}

export const BookingViewSchema = z
  .object({
    id: z.string(),
    reference: z.string(),
    leadId: z.string(),
    leadReference: z.string(),
    module: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
    status: BookingStatusSchema,
    paymentStatus: PaymentStatusSchema,
    amount: z.number().int(),
    paid: z.number().int(),
    due: z.number().int(),
    pnr: z.string().nullable(),
    tickets: z.array(z.string()),
    supplier: z.string().nullable(),
    travelDate: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    updatedBy: z.string().nullable(),
  })
  .strict();
export type BookingView = z.infer<typeof BookingViewSchema>;
