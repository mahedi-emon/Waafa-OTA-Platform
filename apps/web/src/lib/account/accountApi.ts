import "server-only";
import {
  AccountViewSchema,
  CustomerSessionSchema,
  EmailCodeResultSchema,
  GoogleSignInConfigSchema,
  type AccountView,
  type CustomerSession,
  type EmailCodeResult,
  type GoogleSignInConfig,
  type SignUpComplete,
} from "@waafa/shared";
import { ApiError, apiConfig, callApi } from "@/lib/data/api/apiClient";

/*
 * Customer accounts through the API (issue 134). Only in API mode: on the Sample fixtures there is no API, so
 * sign-in reports itself off. The session token goes to the API in a header, never in a URL.
 */

const OFF: GoogleSignInConfig = { enabled: false, clientId: null };
const sessionHeaders = (token: string) => ({ "x-customer-session": token });

/** Email code sign-in needs the API (on the Sample fixtures there is none). */
export function emailSignInReady(): boolean {
  return apiConfig() !== null;
}

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

type Visitor = { clientIp?: string; userAgent?: string };
const visitorOptions = (visitor: Visitor) => ({
  ...(visitor.clientIp ? { clientIp: visitor.clientIp } : {}),
  ...(visitor.userAgent ? { headers: { "user-agent": visitor.userAgent.slice(0, 200) } } : {}),
});

export type CodeRequestOutcome =
  { ok: true } | { ok: false; reason: "off" | "busy" | "unavailable" };

/** Asks the API to email a sign-in code (issue 241). The API answers the same for every address. */
export async function requestEmailCode(
  email: string,
  visitor: Visitor,
): Promise<CodeRequestOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, reason: "off" };
  try {
    await callApi(api, "/api/v1/public/auth/email/code", {
      body: { email },
      ...visitorOptions(visitor),
      timeoutMs: 10_000,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) return { ok: false, reason: "busy" };
    return { ok: false, reason: "unavailable" };
  }
}

export type CodeRefusal =
  "wrong-code" | "expired" | "locked" | "disabled" | "busy" | "off" | "unavailable";
export type CodeVerifyOutcome =
  { ok: true; result: EmailCodeResult } | { ok: false; reason: CodeRefusal; triesLeft?: number };

/** Checks a code: a session for an account, or a sign-up ticket for a new address. */
export async function verifyEmailCode(
  input: { email: string; code: string },
  visitor: Visitor,
): Promise<CodeVerifyOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, reason: "off" };
  try {
    const body = await callApi(api, "/api/v1/public/auth/email/verify", {
      body: input,
      ...visitorOptions(visitor),
      timeoutMs: 10_000,
    });
    return { ok: true, result: EmailCodeResultSchema.parse(body) };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) return { ok: false, reason: "busy" };
      if (error.status === 401) {
        const code = error.body.code;
        const triesLeft =
          typeof error.body.triesLeft === "number" ? error.body.triesLeft : undefined;
        if (code === "wrong-code" || code === "expired" || code === "locked")
          return { ok: false, reason: code, ...(triesLeft === undefined ? {} : { triesLeft }) };
        return { ok: false, reason: "disabled" };
      }
      if (error.status === 422) return { ok: false, reason: "wrong-code" };
    }
    return { ok: false, reason: "unavailable" };
  }
}

export type SignUpOutcome =
  | { ok: true; session: CustomerSession }
  | { ok: false; reason: "expired" | "busy" | "off" | "unavailable" };

/** Finishes sign-up with a name and an E.164 phone; the ticket came from verifyEmailCode. */
export async function completeSignUp(
  input: SignUpComplete,
  visitor: Visitor,
): Promise<SignUpOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, reason: "off" };
  try {
    const body = await callApi(api, "/api/v1/public/auth/email/complete", {
      body: input,
      ...visitorOptions(visitor),
      timeoutMs: 10_000,
    });
    return { ok: true, session: CustomerSessionSchema.parse(body) };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) return { ok: false, reason: "busy" };
      if (error.status === 401 || error.status === 422) return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "unavailable" };
  }
}

export type AccountWriteOutcome = { ok: boolean; status: number; body: Record<string, unknown> };

/** One My account change (issue 278) through the API with the session; the caller maps the answer. */
export async function accountWrite(
  path: string,
  token: string | undefined,
  body: unknown,
): Promise<AccountWriteOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, status: 404, body: {} };
  if (!token) return { ok: false, status: 401, body: {} };
  try {
    const answer = await callApi(api, `/api/v1/public/account/${path}`, {
      body: body ?? {},
      headers: sessionHeaders(token),
      timeoutMs: 10_000,
    });
    return { ok: true, status: 200, body: (answer ?? {}) as Record<string, unknown> };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, status: error.status, body: error.body };
    return { ok: false, status: 503, body: {} };
  }
}

/** Password sign-in for an account that set one (issue 278). */
export async function signInWithPassword(
  input: { email: string; password: string },
  visitor: Visitor,
): Promise<SignInOutcome> {
  const api = apiConfig();
  if (!api) return { ok: false, reason: "off" };
  try {
    const body = await callApi(api, "/api/v1/public/auth/password", {
      body: input,
      ...visitorOptions(visitor),
      timeoutMs: 10_000,
    });
    return { ok: true, session: CustomerSessionSchema.parse(body) };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) return { ok: false, reason: "busy" };
      if (error.status === 401 || error.status === 422) return { ok: false, reason: "refused" };
    }
    return { ok: false, reason: "unavailable" };
  }
}

/** Whether the signed-in customer may review a package or product (issue 245); signed out when there is no session. */
export async function reviewEligibility(
  kind: "package" | "product",
  targetId: string,
  token: string | undefined,
): Promise<{ signedIn: boolean; eligible: boolean; reviewed: boolean }> {
  const none = { signedIn: false, eligible: false, reviewed: false };
  const api = apiConfig();
  if (!api || !token) return none;
  try {
    const query = new URLSearchParams({ kind, targetId }).toString();
    const answer = (await callApi(api, `/api/v1/public/account/reviews/eligibility?${query}`, {
      headers: sessionHeaders(token),
      timeoutMs: 5_000,
    })) as Partial<typeof none>;
    return {
      signedIn: answer.signedIn === true,
      eligible: answer.eligible === true,
      reviewed: answer.reviewed === true,
    };
  } catch {
    return none;
  }
}
