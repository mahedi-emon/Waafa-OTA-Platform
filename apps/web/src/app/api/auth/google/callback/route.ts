import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { signInWithGoogle } from "@/lib/account/accountApi";
import {
  GOOGLE_CALLBACK_PATH,
  OAUTH_COOKIE,
  SESSION_COOKIE,
  decodePending,
} from "@/lib/account/googleOAuth";
import { seeOther } from "@/lib/account/redirects";
import { clientKey } from "@/lib/rateLimit";
import { absoluteUrl } from "@/lib/siteUrl";

function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Google sends the visitor back here (issue 134). The state must match the cookie set by /api/auth/google/start;
 * the API exchanges the code with the PKCE verifier and answers with a session, kept in an httpOnly cookie.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const store = await cookies();
  const pending = decodePending(store.get(OAUTH_COOKIE)?.value);

  const finish = (path: string) => {
    const response = seeOther(path);
    response.cookies.set(OAUTH_COOKIE, "", { path: GOOGLE_CALLBACK_PATH, maxAge: 0 });
    return response;
  };

  // The visitor closed Google's screen or refused to share their email.
  if (params.get("error")) return finish("/login?error=cancelled");
  const code = params.get("code");
  const state = params.get("state");
  if (!pending || !code || !state || !sameState(state, pending.state)) {
    return finish("/login?error=expired");
  }

  const outcome = await signInWithGoogle(
    {
      code: code.slice(0, 2048),
      codeVerifier: pending.verifier,
      redirectUri: absoluteUrl(GOOGLE_CALLBACK_PATH),
    },
    {
      clientIp: clientKey(request.headers),
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  );
  if (!outcome.ok) return finish(`/login?error=${outcome.reason}`);

  const response = finish(pending.next);
  response.cookies.set(SESSION_COOKIE, outcome.session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(outcome.session.expiresAt),
  });
  return response;
}
