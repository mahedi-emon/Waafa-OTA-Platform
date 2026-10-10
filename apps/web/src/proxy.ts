import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  isAdminPath,
  isSignInPath,
  secondsLeft,
  sessionCookies,
  type SessionTokens,
} from "./lib/admin/tokens";

const intl = createMiddleware(routing);

/** Refreshes a staff session that is about to expire (rotating refresh token, D129); null when it can't. */
async function refreshSession(refreshToken: string): Promise<SessionTokens | null> {
  const base = process.env.WAAFA_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok ? ((await response.json()) as SessionTokens) : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the locale for every page request (unprefixed English paths are served from `/[locale]`). On admin pages
 * it also keeps the staff session fresh: an access token with less than a minute left is exchanged with the refresh
 * cookie before the page renders, and a session that can't be refreshed goes to the sign-in page.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isAdminPath(pathname) || isSignInPath(pathname)) {
    const response = intl(request);
    if (isAdminPath(pathname)) response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let fresh: SessionTokens | null = null;
  if (secondsLeft(access) < 60) {
    fresh = refresh ? await refreshSession(refresh) : null;
    if (!fresh) {
      const signIn = new URL("/admin/sign-in", request.url);
      signIn.searchParams.set("next", `${pathname}${search}`);
      const response = NextResponse.redirect(signIn);
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(REMEMBER_COOKIE);
      return response;
    }
    // The page renders with the new tokens; the browser stores them from the response.
    request.cookies.set(ACCESS_COOKIE, fresh.accessToken);
    request.cookies.set(REFRESH_COOKIE, fresh.refreshToken);
  }
  const response = intl(request);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  if (fresh) {
    // A refresh cookie set without "Keep me signed in" has no expiry; keep it that way unless it was persistent.
    const remember = request.cookies.has(REMEMBER_COOKIE);
    for (const cookie of sessionCookies(fresh, remember)) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
  }
  return response;
}

export const config = {
  // Every path except API routes, Next.js internals, Vercel internals and files with an extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
