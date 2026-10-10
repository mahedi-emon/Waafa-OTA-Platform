import { PaymentProofInputSchema } from "@waafa/shared";
import { submitPaymentProof } from "@/lib/data/leads";
import { createSubmissionHandler } from "@/lib/http/handleSubmission";

/** Offline payment proof (OfflinePay board): stored for the accounts team; the reply echoes the reference only. */
export const POST = createSubmissionHandler({
  name: "payment-proof",
  perMinute: 5,
  maxBytes: 8_192,
  field: "proof",
  schema: PaymentProofInputSchema,
  run: (input, context) => submitPaymentProof(input, context),
});
