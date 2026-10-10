import { z } from "zod";
import type { PaymentProofInput } from "@waafa/shared";
import { isPhoneCountry, toE164 } from "./phone";

/*
 * "Send us the proof" (OfflinePay, OfflinePay-sent): the reference, who paid, how much, which account, and the
 * transaction ID or the slip. Messages are next-intl keys under "OfflinePay.proof.errors".
 */

export const paymentProofFormSchema = z
  .object({
    reference: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}-\d{6}-\d{4}$/, "referenceInvalid"),
    name: z.string().trim().min(2, "nameRequired").max(80, "nameRequired"),
    phoneCountry: z.string(),
    phone: z.string().trim().min(1, "phoneInvalid"),
    amount: z.string().trim(),
    accountId: z.string().min(1, "accountRequired"),
    transactionId: z.string().trim().max(40),
  })
  .superRefine((values, ctx) => {
    if (!isPhoneCountry(values.phoneCountry) || !toE164(values.phone, values.phoneCountry)) {
      ctx.addIssue({ code: "custom", message: "phoneInvalid", path: ["phone"] });
    }
    const amount = Number(values.amount.replace(/[,\s৳]/g, ""));
    if (!Number.isInteger(amount) || amount <= 0) {
      ctx.addIssue({ code: "custom", message: "amountInvalid", path: ["amount"] });
    }
  });

export type PaymentProofFormValues = z.infer<typeof paymentProofFormSchema>;

export type SlipFile = {
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
};

/** True when the form has what the accounts team needs to match the payment. */
export function hasTransactionOrSlip(values: PaymentProofFormValues, slip: SlipFile | null) {
  return values.transactionId.trim().length >= 4 || slip !== null;
}

/** The shared payment proof contract (the server validates again). */
export function buildPaymentProof(
  values: PaymentProofFormValues,
  slip: SlipFile | null,
): PaymentProofInput {
  const phone = isPhoneCountry(values.phoneCountry)
    ? toE164(values.phone, values.phoneCountry)
    : null;
  return {
    reference: values.reference.trim().toUpperCase(),
    name: values.name.trim(),
    phone: phone ?? "",
    amount: Number(values.amount.replace(/[,\s৳]/g, "")),
    accountId: values.accountId,
    ...(values.transactionId.trim() ? { transactionId: values.transactionId.trim() } : {}),
    ...(slip ? { proof: { kind: "payment-proof", ...slip } } : {}),
  };
}
