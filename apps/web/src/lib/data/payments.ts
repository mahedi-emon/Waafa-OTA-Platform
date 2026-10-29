import "server-only";
import {
  PaymentConfirmInputSchema,
  PaymentStartInputSchema,
  type PaymentOutcome,
} from "@waafa/shared";
import { apiConfig, callApi } from "./api/apiClient";

/**
 * Online payment (FR-SHOP-07, issue 251). API mode only: the API holds the gateway keys and confirms every payment
 * with the gateway itself. Without the API there is no gateway, so checkout never offers it.
 */
export async function startPayment(
  input: unknown,
  clientIp?: string,
): Promise<{ redirectUrl: string } | null> {
  const parsed = PaymentStartInputSchema.safeParse(input);
  const api = apiConfig();
  if (!parsed.success || !api) return null;
  return callApi<{ redirectUrl: string }>(api, "/api/v1/public/payments/start", {
    ...(clientIp ? { clientIp } : {}),
    body: parsed.data,
  });
}

export async function confirmPayment(
  gateway: string,
  input: unknown,
): Promise<{ reference: string; outcome: PaymentOutcome }> {
  const parsed = PaymentConfirmInputSchema.safeParse(input);
  const api = apiConfig();
  if (!parsed.success || !api) return { reference: "", outcome: "failed" };
  return callApi(api, `/api/v1/public/payments/${encodeURIComponent(gateway)}/confirm`, {
    body: parsed.data,
  });
}
