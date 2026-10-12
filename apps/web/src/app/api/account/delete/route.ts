import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteAccount } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";
import { isSameOrigin, seeOther } from "@/lib/account/redirects";

/**
 * Delete account (issues 134 and 138): needs the confirmation tick; requests and orders stay with the business.
 * Answers with a 303, so /login loads in full with its notice.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData().catch(() => null);
  if (form?.get("confirm") !== "yes") return seeOther("/account?error=confirm");
  const store = await cookies();
  const deleted = await deleteAccount(store.get(SESSION_COOKIE)?.value);
  if (!deleted) return seeOther("/account?error=delete");
  const response = seeOther("/login?deleted=1");
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
