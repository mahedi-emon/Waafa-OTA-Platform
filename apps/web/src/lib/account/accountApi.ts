import "server-only";
import {
  AccountViewSchema,
  CustomerSessionSchema,
  GoogleSignInConfigSchema,
  type AccountView,
  type CustomerSession,
  type GoogleSignInConfig,
} from "@waafa/shared";
import { ApiError, apiConfig, callApi } from "@/lib/data/api/apiClient";

/*
 * Customer accounts through the API (issue 134). Only in API mode: on the Sample fixtures there is no API, so
 * sign-in reports itself off. The session token goes to the API in a header, never in a URL.
 */

const OFF: GoogleSignInConfig = { enabled: false, clientId: null };
const sessionHeaders = (token: string) => ({ "x-customer-session": token });

/** Whether Google sign-in is on (Admin › Integrations › Sign-in) and its public client ID. */
export async function googleSignInConfig(): Promise<GoogleSignInConfig> {
  const api = apiConfig();
  if (!api) return OFF;
  try {
    return GoogleSignInConfigSchema.parse(
      await callApi(api, "/api/v1/public/auth/google/config", { timeoutMs: 5_000 }),
    );
  } catch {
    return OFF;
  }
}

export type SignInOutcome =
  | { ok: true; session: CustomerSession }
  | { ok: false; reason: "refused" | "off" | "busy" | "unavailable" };

/** Hands Google's code and the PKCE verifier to the API, which exchanges them and opens a session. */
export async function signInWithGoogle(
  input: { code: string; codeVerifier: string; redirectUri: string },
  context: { clientIp?: string; userAgent?: string },
): Promise<SignInOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, reason: "off" };
  try {
    const body = await callApi(api, "/api/v1/public/auth/google", {
      body: input,
      ...(context.clientIp ? { clientIp: context.clientIp } : {}),
      ...(context.userAgent ? { headers: { "user-agent": context.userAgent.slice(0, 200) } } : {}),
      timeoutMs: 15_000,
    });
    return { ok: true, session: CustomerSessionSchema.parse(body) };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) return { ok: false, reason: "off" };
      if (error.status === 429) return { ok: false, reason: "busy" };
      if (error.status === 400 || error.status === 401 || error.status === 422) {
        return { ok: false, reason: "refused" };
      }
    }
    return { ok: false, reason: "unavailable" };
  }
}

/** My account for a session token; null when the session is missing, ended or expired. */
export async function readAccount(token: string | undefined): Promise<AccountView | null> {
  const api = apiConfig();
  if (!api || !token) return null;
  try {
    return AccountViewSchema.parse(
      await callApi(api, "/api/v1/public/account", { headers: sessionHeaders(token) }),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** Ends the session at the API; a failure still lets the cookie be cleared. */
export async function endSession(token: string | undefined): Promise<void> {
  const api = apiConfig();
  if (!api || !token) return;
  await callApi(api, "/api/v1/public/account/sign-out", {
    method: "POST",
    headers: sessionHeaders(token),
  }).catch(() => undefined);
}

export async function deleteAccount(token: string | undefined): Promise<boolean> {
  const api = apiConfig();
  if (!api || !token) return false;
  try {
    await callApi(api, "/api/v1/public/account/delete", {
      method: "POST",
      headers: sessionHeaders(token),
    });
    return true;
  } catch {
    return false;
  }
}
