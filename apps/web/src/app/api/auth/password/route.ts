import { NextResponse } from "next/server";
import { PasswordSignInSchema } from "@waafa/shared";
import { signInWithPassword } from "@/lib/account/accountApi";
import { setSessionCookie } from "@/lib/account/sessionCookie";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

/**
 * Password sign-in for an account that set one (issue 278). A wrong email or password is an ordinary answer (200 with
 * `error`); the email code stays the way back in when a password is forgotten.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`password:${ip}`)) return NextResponse.json({ error: "busy" }, { status: 429 });
  const text = await readCappedBody(request, 2_000);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = PasswordSignInSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "refused" });
  const outcome = await signInWithPassword(parsed.data, {
    clientIp: ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  if (!outcome.ok) {
    if (outcome.reason === "busy") return NextResponse.json({ error: "busy" }, { status: 429 });
    return NextResponse.json({ error: outcome.reason });
  }
  const response = NextResponse.json({ status: "signed-in" });
  setSessionCookie(response, outcome.session);
  return response;
}
