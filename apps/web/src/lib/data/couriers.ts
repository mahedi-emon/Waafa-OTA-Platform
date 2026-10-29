import "server-only";
import { apiConfig, ApiError, callApi } from "./api/apiClient";

/** The couriers whose status webhook this site takes (issue 253). */
export const WEBHOOK_COURIERS = ["steadfast"] as const;

/**
 * A courier's status push (FR-SHOP-14, issue 253), passed to the API with the bearer token the courier sent. The API
 * checks the token; this answers the status the courier should see (200 taken, 401 wrong token, 503 no API).
 */
export async function forwardCourierWebhook(
  courier: string,
  token: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const api = apiConfig();
  if (!api) return 503;
  try {
    await callApi(api, `/api/v1/public/couriers/${encodeURIComponent(courier)}/webhook`, {
      headers: { "x-courier-token": token },
      body: payload,
    });
    return 200;
  } catch (error) {
    return error instanceof ApiError && error.status === 401 ? 401 : 503;
  }
}
