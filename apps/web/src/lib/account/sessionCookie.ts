import type { NextResponse } from "next/server";
import type { CustomerSession } from "@waafa/shared";
import { SESSION_COOKIE } from "./googleOAuth";

/** The 15-minute sign-up ticket between the code step and the name-and-phone step (issue 241); httpOnly, never JS. */
export const SIGNUP_COOKIE = "waafa_signup";
export const SIGNUP_COOKIE_PATH = "/api/auth/email";

/**
 * A readable "signed in" hint, not a secret (like the staff hint, D243): the header, phone drawer and More sheet show
 * My account instead of Log in without reading the session on the server, so the page shell stays static.
 */
export const HINT_COOKIE = "waafa_customer_hint";

const secure = () => process.env.NODE_ENV === "production";

/** The customer's session in an httpOnly cookie; the admin uses other cookies, so the two never mix. */
export function setSessionCookie(response: NextResponse, session: CustomerSession): void {
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  response.cookies.set(HINT_COOKIE, "1", {
    httpOnly: false,
    secure: secure(),
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

/** Sign-out and account deletion: the session and its hint go together. */
export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(HINT_COOKIE, "", { path: "/", maxAge: 0 });
}

export function setSignUpCookie(response: NextResponse, ticket: string, minutes: number): void {
  response.cookies.set(SIGNUP_COOKIE, ticket, {
    httpOnly: true,
    secure: secure(),
    sameSite: "strict",
    path: SIGNUP_COOKIE_PATH,
    maxAge: minutes * 60,
  });
}

export function clearSignUpCookie(response: NextResponse): void {
  response.cookies.set(SIGNUP_COOKIE, "", { path: SIGNUP_COOKIE_PATH, maxAge: 0 });
}
