import { z } from "zod";

/** The online gateways the store can take payment through (FR-SHOP-07, issue 251). */
export const ONLINE_GATEWAYS = ["sslcommerz", "bkash", "nagad"] as const;
export const OnlineGatewaySchema = z.enum(ONLINE_GATEWAYS);

/** Starts the gateway for an order the visitor just placed (the phone proves it is theirs). */
export const PaymentStartInputSchema = z
  .object({
    reference: z.string().regex(/^ORD-\d{6}-\d{4,6}$/, "Unknown order"),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Enter a valid phone number"),
  })
  .strict();

/** Where the gateway sent the customer or its server back to us. */
export const PaymentEventSchema = z.enum(["success", "fail", "cancel", "ipn", "callback"]);

/**
 * A gateway's return, passed on as it came: the API never trusts these fields, it asks the gateway itself (SSLCommerz
 * validation, bKash execute, Nagad verify) before it marks anything paid.
 */
export const PaymentConfirmInputSchema = z
  .object({
    event: PaymentEventSchema,
    params: z
      .record(z.string().max(60), z.string().max(2000))
      .refine((params) => Object.keys(params).length <= 80, "Too many fields"),
  })
  .strict();

export const PaymentOutcomeSchema = z.enum(["paid", "failed", "cancelled", "pending"]);

/** A refund staff made in the gateway's own panel, written on the order (FR-SHOP-07). */
export const RefundRecordInputSchema = z
  .object({
    amount: z.number().int().positive(),
    reference: z.string().trim().min(2).max(60),
    note: z.string().trim().max(300).optional(),
  })
  .strict();

export type OnlineGateway = z.infer<typeof OnlineGatewaySchema>;
export type PaymentStartInput = z.infer<typeof PaymentStartInputSchema>;
export type PaymentEvent = z.infer<typeof PaymentEventSchema>;
export type PaymentConfirmInput = z.infer<typeof PaymentConfirmInputSchema>;
export type PaymentOutcome = z.infer<typeof PaymentOutcomeSchema>;
export type RefundRecordInput = z.infer<typeof RefundRecordInputSchema>;
