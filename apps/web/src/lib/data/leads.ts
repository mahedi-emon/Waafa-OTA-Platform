import "server-only";
import {
  LeadCreateInputSchema,
  LeadDraftInputSchema,
  PaymentProofInputSchema,
  type PaymentProof,
  SearchLogInputSchema,
  SubscriberInputSchema,
  type LeadCreated,
  type SearchLogInput,
} from "@waafa/shared";
import { apiConfig, callApi, type IntakeContext } from "./api/apiClient";
import { repositories } from "./source";

/**
 * Validates a public form submission against the shared contract and records it as a lead. Server
 * actions call this; it is never cached, because every call is a write.
 */
export async function createLead(
  input: unknown,
  context: IntakeContext = {},
): Promise<LeadCreated> {
  const lead = LeadCreateInputSchema.parse(input);
  const api = apiConfig();
  if (api) return callApi<LeadCreated>(api, "/api/v1/public/leads", { ...context, body: lead });
  return repositories.leads.createLead(lead, new Date());
}

/**
 * Keeps step 1 of a request with the visitor's OK (FR-FLT-08, issue 250). API mode only: the fixture data has no
 * admin queue for it, so there it is accepted and dropped.
 */
export async function saveLeadDraft(input: unknown, context: IntakeContext = {}): Promise<boolean> {
  const parsed = LeadDraftInputSchema.safeParse(input);
  if (!parsed.success) return false;
  const api = apiConfig();
  if (api)
    await callApi(api, "/api/v1/public/leads/drafts", {
      clientIp: context.clientIp,
      body: parsed.data,
    });
  return true;
}

/** Records a submitted search (FR-SRCH-10). Returns false for input that fails the shared contract. */
export async function logSearch(input: unknown, context: IntakeContext = {}): Promise<boolean> {
  const parsed = SearchLogInputSchema.safeParse(input);
  if (!parsed.success) return false;
  const search: SearchLogInput = parsed.data;
  const api = apiConfig();
  if (api) {
    await callApi(api, "/api/v1/public/search-logs", { clientIp: context.clientIp, body: search });
  } else {
    await repositories.leads.logSearch(search, new Date());
  }
  return true;
}

/** Offline payment proof (OfflinePay board): stored for the accounts team to match. Never cached (a write). */
export async function submitPaymentProof(
  input: unknown,
  context: IntakeContext = {},
): Promise<{ reference: string; receivedAt: string }> {
  const proof = PaymentProofInputSchema.parse(input);
  const api = apiConfig();
  if (api) {
    return callApi<{ reference: string; receivedAt: string }>(
      api,
      "/api/v1/public/payment-proofs",
      {
        ...context,
        body: proof,
      },
    );
  }
  const stored: PaymentProof = await repositories.leads.submitPaymentProof(proof, new Date());
  return { reference: stored.reference, receivedAt: stored.createdAt };
}

/** Footer newsletter (FR-FTR-05): stored by the API; fixture mode confirms without storing (D35). */
export async function subscribe(input: unknown, context: IntakeContext = {}): Promise<boolean> {
  const parsed = SubscriberInputSchema.safeParse(input);
  if (!parsed.success) return false;
  const api = apiConfig();
  if (api)
    await callApi(api, "/api/v1/public/subscribers", {
      clientIp: context.clientIp,
      body: parsed.data,
    });
  return true;
}
