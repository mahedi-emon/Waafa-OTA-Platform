import { createHash, randomBytes } from "node:crypto";

/*
 * Google sign-in on the web side (issue 134): the redirect to Google with a random state and a PKCE challenge, and the
 * short-lived cookie that carries the state, the verifier and where to go after. The API exchanges the code.
 */

export const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_START_PATH = "/api/auth/google/start";
/** Must match the authorised redirect URI in Google Cloud and the API's check. */
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

/** Holds state, verifier and next for ten minutes, sent only to the callback. */
export const OAUTH_COOKIE = "waafa_oauth";
export const OAUTH_COOKIE_MAX_AGE = 10 * 60;
/** The customer session (opaque token from the API), httpOnly. */
export const SESSION_COOKIE = "waafa_customer";

export type OAuthPending = { state: string; verifier: string; next: string };

/** RFC 7636 S256: a 64-character verifier and its SHA-256 challenge, both base64url. */
export function newPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export function newState(): string {
  return randomBytes(24).toString("base64url");
}

export function authorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
}): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: params.state,
    code_challenge: params.challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/** Only this site's own pages: a path, not "//host", not the API, short; anything else goes to My account. */
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || value.length > 200) return "/account";
  // Printable ASCII only, no backslash, and not "//": browsers drop tabs and newlines when they read a Location
  // header, so "/\t/evil.example.com" would otherwise become the protocol-relative "//evil.example.com".
  if (!/^\/(?!\/)[\x21-\x5B\x5D-\x7E]*$/.test(value)) return "/account";
  if (value.startsWith("/api/") || value === "/login" || value.startsWith("/login?"))
    return "/account";
  return value;
}

export function encodePending(pending: OAuthPending): string {
  return Buffer.from(JSON.stringify(pending)).toString("base64url");
}

export function decodePending(value: string | undefined): OAuthPending | null {
  if (!value || value.length > 1024) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const { state, verifier, next } = parsed as Record<string, unknown>;
    if (typeof state !== "string" || typeof verifier !== "string" || typeof next !== "string") {
      return null;
    }
    return { state, verifier, next: safeNext(next) };
  } catch {
    return null;
  }
}
