import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { endSession } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";
import { isSameOrigin, seeOther } from "@/lib/account/redirects";
import { clearSessionCookies } from "@/lib/account/sessionCookie";

/**
 * Log out (issues 134 and 138): a plain form post, answered with a 303 so the browser loads the home page in full
 * (a server action redirecting into a page that streams failed with React error 412).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const store = await cookies();
  await endSession(store.get(SESSION_COOKIE)?.value);
  const response = seeOther("/");
  clearSessionCookies(response);
  return response;
}
