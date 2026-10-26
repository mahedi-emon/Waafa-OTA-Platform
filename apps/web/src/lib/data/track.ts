import "server-only";
import { TrackResultSchema, type TrackResult } from "@waafa/shared";
import { ApiError, apiConfig, callApi, type IntakeContext } from "./api/apiClient";
import { repositories } from "./source";

/**
 * /track (issue 240): a request, visa application or order by its reference and the phone on it. On the Sample
 * fixtures only orders can be found (requests are not kept there); the API answers for both.
 */
export async function trackReference(
  reference: string,
  phone: string,
  context: IntakeContext = {},
): Promise<TrackResult | null> {
  const api = apiConfig();
  if (!api) {
    if (!/^ORD-/i.test(reference.trim())) return null;
    const order = await repositories.shop.findOrder(reference, phone);
    return order ? { kind: "order", order } : null;
  }
  try {
    return TrackResultSchema.parse(
      await callApi(api, "/api/v1/public/track", {
        clientIp: context.clientIp,
        body: { reference, phone },
      }),
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) return null;
    throw error;
  }
}
