import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  isAdminApiPath,
  isAdminPath,
  isSignInPath,
  secondsLeft,
  sessionCookies,
  type SessionTokens,
} from "./lib/admin/tokens";
import { PREVIEW_HINT_COOKIE, STAFF_HINT_COOKIE } from "./lib/staffHint";

const intl = createMiddleware(routing);

/** Next.js keeps draft mode in this cookie (`draftMode().enable()`). */
const DRAFT_MODE_COOKIE = "__prerender_bypass";

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

/** Ends Preview of unpublished changes in this browser (D0 R7): no drafts once the staff session is gone. */
function endPreview(response: NextResponse) {
  response.cookies.delete(DRAFT_MODE_COOKIE);
  response.cookies.delete(PREVIEW_HINT_COOKIE);
}

/**
 * Resolves the locale for every page request (unprefixed English paths are served from `/[locale]`). On admin pages
 * it also keeps the staff session fresh: an access token with less than a minute left is exchanged with the refresh
 * cookie before the page renders, and a session that can't be refreshed goes to the sign-in page. A preview left on
 * after the session ended is switched off before a public page renders.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isAdminPath(pathname) || isSignInPath(pathname)) {
    // Drafts show only while a staff session may still be alive (a refresh cookie, or an access token in date).
    const stalePreview =
      request.cookies.has(DRAFT_MODE_COOKIE) &&
      !request.cookies.has(REFRESH_COOKIE) &&
      secondsLeft(request.cookies.get(ACCESS_COOKIE)?.value) <= 0;
    if (stalePreview) request.cookies.delete(DRAFT_MODE_COOKIE);
    const response = intl(request);
    if (stalePreview) endPreview(response);
    if (isAdminPath(pathname)) response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let fresh: SessionTokens | null = null;
  if (secondsLeft(access) < 60) {
    fresh = refresh ? await refreshSession(refresh) : null;
    if (!fresh) {
      const signIn = new URL("/secure-admin-control/sign-in", request.url);
      signIn.searchParams.set("next", `${pathname}${search}`);
      // A page goes to the sign-in page; the admin's own JSON routes answer 401, so the screen shows "Your session
      // has ended" and keeps the work on it (D201) instead of reading the sign-in page as data.
      const response = isAdminApiPath(pathname)
        ? NextResponse.json({ status: 401, title: "Signed out" }, { status: 401 })
        : NextResponse.redirect(signIn);
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(REMEMBER_COOKIE);
      response.cookies.delete(STAFF_HINT_COOKIE);
      endPreview(response);
      return response;
    }
    // The page renders with the new tokens; the browser stores them from the response.
    request.cookies.set(ACCESS_COOKIE, fresh.accessToken);
    request.cookies.set(REFRESH_COOKIE, fresh.refreshToken);
  }
  const response = intl(request);
  response.headers.set("x-robots-tag", "noindex, nofollow");
  // A refresh cookie set without "Keep me signed in" has no expiry; keep it that way unless it was persistent.
  const remember = request.cookies.has(REMEMBER_COOKIE);
  // Staff signed in before the hint existed get it on their next admin page (D0 R7): the site's staff tools follow
  // it. It grants nothing (the session cookies stay httpOnly) and lives as long as the session can.
  if (!request.cookies.has(STAFF_HINT_COOKIE)) {
    response.cookies.set(STAFF_HINT_COOKIE, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(fresh && remember ? { expires: new Date(fresh.refreshExpiresAt) } : {}),
    });
  }
  if (fresh) {
    for (const cookie of sessionCookies(fresh, remember)) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
  }
  return response;
}

export const config = {
  // Every path except API routes, Next.js internals, Vercel internals, files with an extension and the media uploads:
  // Next copies the body of every request the proxy sees and keeps only its first 10 MB, so a 12 MB photo or a 50 MB
  // video must stream past it (D211). The upload routes check the session themselves.
  matcher: ["/((?!api|_next|_vercel|secure-admin-control/media/upload|.*\\..*).*)"],
};
