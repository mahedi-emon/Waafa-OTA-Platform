import "server-only";
import {
  LeadCreateInputSchema,
  PaymentProofInputSchema,
  type PaymentProof,
  SearchLogInputSchema,
  type LeadCreated,
  type SearchLogInput,
} from "@waafa/shared";
import { repositories } from "./source";

/**
 * Validates a public form submission against the shared contract and records it as a lead. Server
 * actions call this; it is never cached, because every call is a write.
 */
export async function createLead(input: unknown): Promise<LeadCreated> {
  return repositories.leads.createLead(LeadCreateInputSchema.parse(input), new Date());
}

/** Records a submitted search (FR-SRCH-10). Returns false for input that fails the shared contract. */
export async function logSearch(input: unknown): Promise<boolean> {
  const parsed = SearchLogInputSchema.safeParse(input);
  if (!parsed.success) return false;
  const search: SearchLogInput = parsed.data;
  await repositories.leads.logSearch(search, new Date());
  return true;
}

/** Offline payment proof (OfflinePay board): stored for the accounts team to match. Never cached (a write). */
export async function submitPaymentProof(input: unknown): Promise<PaymentProof> {
  return repositories.leads.submitPaymentProof(PaymentProofInputSchema.parse(input), new Date());
}
