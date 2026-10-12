import { NextResponse } from "next/server";
import { googleSignInConfig } from "@/lib/account/accountApi";
import {
  GOOGLE_CALLBACK_PATH,
  OAUTH_COOKIE,
  OAUTH_COOKIE_MAX_AGE,
  authorizeUrl,
  encodePending,
  newPkce,
  newState,
  safeNext,
} from "@/lib/account/googleOAuth";
import { seeOther } from "@/lib/account/redirects";
import { getSiteSettings } from "@/lib/data/settings";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Starts Google sign-in (issue 134): a fresh state and PKCE verifier go into a ten-minute httpOnly cookie that only
 * the callback receives, and the visitor goes to Google. Off (accounts not live or Google not connected) → /login.
 */
export async function GET(request: Request) {
  const next = safeNext(new URL(request.url).searchParams.get("next") ?? undefined);
  const [site, config] = await Promise.all([getSiteSettings(), googleSignInConfig()]);
  if (!site.accountsLive || !config.enabled || !config.clientId) {
    return seeOther("/login?error=off");
  }
  const { verifier, challenge } = newPkce();
  const state = newState();
  const response = NextResponse.redirect(
    authorizeUrl({
      clientId: config.clientId,
      redirectUri: absoluteUrl(GOOGLE_CALLBACK_PATH),
      state,
      challenge,
    }),
    303,
  );
  response.headers.set("cache-control", "no-store");
  response.cookies.set(OAUTH_COOKIE, encodePending({ state, verifier, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax: Google's redirect back is a top-level GET, which carries Lax cookies.
    sameSite: "lax",
    path: GOOGLE_CALLBACK_PATH,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  return response;
}
