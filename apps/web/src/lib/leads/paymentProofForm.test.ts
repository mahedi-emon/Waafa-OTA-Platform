import { describe, expect, it } from "vitest";
import { PaymentProofInputSchema } from "@waafa/shared";
import {
  buildPaymentProof,
  hasTransactionOrSlip,
  paymentProofFormSchema,
  type PaymentProofFormValues,
} from "./paymentProofForm";

const values: PaymentProofFormValues = {
  reference: "ord-261008-0042",
  name: "Rahim Uddin",
  phoneCountry: "BD",
  phone: "01712-345678",
  amount: "3,450",
  accountId: "acc-bkash",
  transactionId: "8N7A6B5C4D",
};

const codes = (input: PaymentProofFormValues) => {
  const result = paymentProofFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe("payment proof form", () => {
  it("normalises the reference and the amount into a contract the server accepts", () => {
    expect(codes(values)).toEqual([]);
    const input = buildPaymentProof(paymentProofFormSchema.parse(values), null);
    expect(PaymentProofInputSchema.safeParse(input).success).toBe(true);
    expect(input).toMatchObject({
      reference: "ORD-261008-0042",
      amount: 3450,
      phone: "+8801712345678",
    });
  });

  it("needs a transaction ID or a slip", () => {
    const noTrx = { ...values, transactionId: "" };
    expect(hasTransactionOrSlip(noTrx, null)).toBe(false);
    expect(
      hasTransactionOrSlip(noTrx, {
        fileName: "slip.pdf",
        mimeType: "application/pdf",
        sizeBytes: 900,
      }),
    ).toBe(true);
    const input = buildPaymentProof(paymentProofFormSchema.parse(noTrx), {
      fileName: "slip.pdf",
      mimeType: "application/pdf",
      sizeBytes: 900,
    });
    expect(PaymentProofInputSchema.safeParse(input).success).toBe(true);
  });

  it("rejects a bad reference, a zero amount and a missing account", () => {
    expect(codes({ ...values, reference: "123", amount: "0", accountId: "" })).toEqual(
      expect.arrayContaining(["referenceInvalid", "amountInvalid", "accountRequired"]),
    );
  });
});
