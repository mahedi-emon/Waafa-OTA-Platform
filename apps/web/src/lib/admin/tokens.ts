/*
 * Staff session cookies (D129): the web signs staff in through the API and keeps the API's tokens in its own httpOnly
 * cookies. The browser never sees a token; the API only ever sees Bearer headers from this server.
 */

export const ACCESS_COOKIE = "waafa_admin_at";
export const REFRESH_COOKIE = "waafa_admin_rt";
/** Set when the person ticked "Keep me signed in", so refreshed cookies stay persistent. */
export const REMEMBER_COOKIE = "waafa_admin_remember";

/** Tokens and lifetimes as the API returns them from /auth/login and /auth/refresh. */
export type SessionTokens = {
  accessToken: string;
  accessExpiresAt: string;
  refreshToken: string;
  refreshExpiresAt: string;
};

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  expires?: Date;
};

const base = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

/** The two cookies to set after a sign-in or a refresh; `remember` keeps the refresh cookie past the browser session. */
export function sessionCookies(tokens: SessionTokens, remember: boolean) {
  return [
    {
      name: ACCESS_COOKIE,
      value: tokens.accessToken,
      options: { ...base(), expires: new Date(tokens.accessExpiresAt) },
    },
    {
      name: REFRESH_COOKIE,
      value: tokens.refreshToken,
      options: remember ? { ...base(), expires: new Date(tokens.refreshExpiresAt) } : base(),
    },
  ];
}

/** Seconds until a JWT expires, read without checking the signature (the API checks it on every call). */
export function secondsLeft(token: string | undefined, now = Date.now()): number {
  if (!token) return 0;
  const payload = token.split(".")[1];
  if (!payload) return 0;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof json.exp === "number" ? json.exp - Math.floor(now / 1000) : 0;
  } catch {
    return 0;
  }
}

/** /admin and /en/admin and everything under them. */
export function isAdminPath(pathname: string): boolean {
  return /^\/(?:[a-z]{2}\/)?admin(?:\/|$)/.test(pathname);
}

export function isSignInPath(pathname: string): boolean {
  return /^\/(?:[a-z]{2}\/)?admin\/sign-in\/?$/.test(pathname);
}

/** Only same-site admin paths may be a post-sign-in destination (no open redirects). */
export function safeNext(value: unknown): string {
  return typeof value === "string" &&
    isAdminPath(value) &&
    !value.startsWith("//") &&
    !isSignInPath(value)
    ? value
    : "/admin";
}
