import { NextResponse } from "next/server";
import { EmailCodeVerifySchema, SIGN_UP_TICKET_MINUTES } from "@waafa/shared";
import { verifyEmailCode } from "@/lib/account/accountApi";
import { setSessionCookie, setSignUpCookie } from "@/lib/account/sessionCookie";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 15, windowMs: 60_000 });

/**
 * Checks a sign-in code (issue 241). An existing account gets its session cookie; a new address gets a 15-minute
 * sign-up ticket in an httpOnly cookie for the name-and-phone step. Wrong, expired and locked codes say so.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`verify:${ip}`)) return NextResponse.json({ error: "busy" }, { status: 429 });
  const text = await readCappedBody(request, 2_000);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = EmailCodeVerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "wrong-code" }, { status: 422 });

  const outcome = await verifyEmailCode(parsed.data, {
    clientIp: ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  if (!outcome.ok) {
    const status =
      outcome.reason === "busy"
        ? 429
        : outcome.reason === "off"
          ? 404
          : outcome.reason === "unavailable"
            ? 503
            : 401;
    return NextResponse.json(
      {
        error: outcome.reason,
        ...(outcome.triesLeft === undefined ? {} : { triesLeft: outcome.triesLeft }),
      },
      { status },
    );
  }
  if (outcome.result.status === "signed-in") {
    const response = NextResponse.json({ status: "signed-in" });
    setSessionCookie(response, outcome.result.session);
    return response;
  }
  const response = NextResponse.json({ status: "new" });
  setSignUpCookie(response, outcome.result.ticket, SIGN_UP_TICKET_MINUTES);
  return response;
}
