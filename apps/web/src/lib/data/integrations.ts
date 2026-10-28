import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { INTEGRATIONS_OFF, IntegrationStatusSchema, type IntegrationStatus } from "@waafa/shared";
import { apiConfig, callApi } from "./api/apiClient";
import { CACHE_TAGS } from "./tags";

/** The last answer this server read, kept when the API is briefly unreachable. */
let lastGood: IntegrationStatus | null = null;

/**
 * Outside services as the site may know them (issue 284): Turnstile site key, measurement IDs, verification codes
 * and which features are on. Read at run time from Admin › Integrations: every save there expires the tag through
 * the API's revalidation call (seconds), so nothing needs a rebuild; a short cacheLife would push every page out of
 * the static shell (see getPublicConfig). Without the API everything is off.
 */
export async function getIntegrations(): Promise<IntegrationStatus> {
  "use cache";
  cacheTag(CACHE_TAGS.integrations);
  const config = apiConfig();
  if (!config) {
    cacheLife("hours");
    return INTEGRATIONS_OFF;
  }
  try {
    const body = await callApi<unknown>(config, "/api/v1/public/integrations/status", {
      timeoutMs: 5_000,
    });
    lastGood = IntegrationStatusSchema.parse(body);
    cacheLife("hours");
    return lastGood;
  } catch {
    // Unreachable for a moment: try again within seconds rather than keep a guess for hours.
    cacheLife("seconds");
    return lastGood ?? INTEGRATIONS_OFF;
  }
}
