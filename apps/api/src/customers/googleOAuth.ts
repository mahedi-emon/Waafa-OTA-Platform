/*
 * Google sign-in (issue 134): the web runs the redirect with state and PKCE and sends the code here; this exchanges it
 * at Google's token endpoint with the client secret from Admin › Integrations. The ID token comes straight from
 * Google over TLS in that exchange, so (OpenID Connect Core 3.1.3.7) its signature need not be checked again; its
 * claims are: issuer, audience, expiry and a verified email.
 */

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
/** Clock difference allowed between this server and Google. */
const SKEW_MS = 60_000;

export type GoogleFetch = (url: string, init: RequestInit) => Promise<Response>;

export type GoogleIdentity = { sub: string; email: string; name: string };

/** The sign-in cannot finish; `reason` is safe to log, never shown with Google's raw answer. */
export class GoogleSignInError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = "GoogleSignInError";
  }
}

/** The claims of a JWT, without checking its signature (see above for why that is enough here). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) throw new GoogleSignInError("ID token is not a JWT");
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("not an object");
    return value as Record<string, unknown>;
  } catch {
    throw new GoogleSignInError("ID token payload is unreadable");
  }
}

/** Checks the ID token's claims for this client and returns who signed in. */
export function identityFromClaims(
  claims: Record<string, unknown>,
  clientId: string,
  now = Date.now(),
): GoogleIdentity {
  if (typeof claims.iss !== "string" || !GOOGLE_ISSUERS.has(claims.iss)) {
    throw new GoogleSignInError("ID token issuer is not Google");
  }
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(clientId)) throw new GoogleSignInError("ID token is for another client");
  if (typeof claims.exp !== "number" || claims.exp * 1000 < now - SKEW_MS) {
    throw new GoogleSignInError("ID token has expired");
  }
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    throw new GoogleSignInError("ID token has no subject");
  }
  if (typeof claims.email !== "string" || !claims.email.includes("@")) {
    throw new GoogleSignInError("Google shared no email address");
  }
  if (claims.email_verified !== true && claims.email_verified !== "true") {
    throw new GoogleSignInError("The Google email address is not verified");
  }
  const email = claims.email.trim().toLowerCase();
  const name =
    typeof claims.name === "string" && claims.name.trim()
      ? claims.name.trim().slice(0, 120)
      : (email.split("@")[0] ?? email);
  return { sub: claims.sub, email, name };
}

/** Exchanges the authorization code (with its PKCE verifier) and returns the verified identity. */
export async function exchangeGoogleCode(
  fetcher: GoogleFetch,
  params: {
    clientId: string;
    clientSecret: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  },
  now = Date.now(),
): Promise<GoogleIdentity> {
  let response: Response;
  try {
    response = await fetcher(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: params.code,
        code_verifier: params.codeVerifier,
        client_id: params.clientId,
        client_secret: params.clientSecret,
        redirect_uri: params.redirectUri,
      }).toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new GoogleSignInError("Google did not answer");
  }
  if (!response.ok)
    throw new GoogleSignInError(`Google refused the code (HTTP ${response.status})`);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new GoogleSignInError("Google answered without JSON");
  }
  const idToken = (body as { id_token?: unknown } | null)?.id_token;
  if (typeof idToken !== "string") throw new GoogleSignInError("Google sent no ID token");
  return identityFromClaims(decodeJwtPayload(idToken), params.clientId, now);
}
