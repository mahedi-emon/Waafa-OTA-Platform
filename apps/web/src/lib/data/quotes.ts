import "server-only";
import { PublicQuoteSchema, QuoteTokenSchema, type PublicQuote } from "@waafa/shared";
import { ApiError, apiConfig, callApi, type IntakeContext } from "./api/apiClient";

/**
 * A customer's quote by its signed link (issue 298). Quotes live in the API only: on the Sample fixtures there are
 * none, so every link is not found.
 */
export async function getQuote(
  token: string,
  context: IntakeContext = {},
): Promise<PublicQuote | null> {
  const api = apiConfig();
  if (!api || !QuoteTokenSchema.safeParse(token).success) return null;
  try {
    return PublicQuoteSchema.parse(
      await callApi(api, `/api/v1/public/quotes/${token}`, { clientIp: context.clientIp }),
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) return null;
    throw error;
  }
}

export type AcceptOutcome =
  | { ok: true; quote: PublicQuote }
  | { ok: false; status: number; error: "invalid" | "conflict" | "expired" | "unavailable" };

/** Accepts one option; the API answers the same for a repeat and refuses another option, expiry or withdrawal. */
export async function acceptQuote(
  token: string,
  optionId: string,
  context: IntakeContext = {},
): Promise<AcceptOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, status: 404, error: "invalid" };
  try {
    const quote = PublicQuoteSchema.parse(
      await callApi(api, "/api/v1/public/quotes/accept", {
        clientIp: context.clientIp,
        body: { token, optionId },
      }),
    );
    return { ok: true, quote };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 409) return { ok: false, status: 409, error: "conflict" };
    if (error.status === 410) return { ok: false, status: 410, error: "expired" };
    if (error.status === 404 || error.status === 422)
      return { ok: false, status: error.status, error: "invalid" };
    throw error;
  }
}

/** The PDF as the API sends it, for the customer's download. */
export async function quotePdf(
  token: string,
  context: IntakeContext = {},
): Promise<Response | null> {
  const api = apiConfig();
  if (!api || !QuoteTokenSchema.safeParse(token).success) return null;
  const headers: Record<string, string> = { "x-intake-key": api.intakeKey };
  if (context.clientIp && context.clientIp !== "unknown") headers["x-client-ip"] = context.clientIp;
  const response = await fetch(`${api.baseUrl}/api/v1/public/quotes/${token}/pdf`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  return response.ok ? response : null;
}
