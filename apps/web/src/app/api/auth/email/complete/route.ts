import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { completeSignUp } from "@/lib/account/accountApi";
import { SIGNUP_COOKIE, clearSignUpCookie, setSessionCookie } from "@/lib/account/sessionCookie";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { isPhoneCountry, toE164 } from "@/lib/leads/phone";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

const ProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(1).max(30),
    phoneCountry: z.string().length(2),
  })
  .strict();

/**
 * The last sign-up step (issue 241): name and phone (a contact field, not verified). Spends the ticket cookie from the
 * code step, opens the session and clears the ticket.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`complete:${ip}`)) return NextResponse.json({ error: "busy" }, { status: 429 });
  const ticket = (await cookies()).get(SIGNUP_COOKIE)?.value;
  if (!ticket) return NextResponse.json({ error: "expired" }, { status: 401 });
  const text = await readCappedBody(request, 2_000);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
      { status: 422 },
    );
  }
  const { name, phone, phoneCountry } = parsed.data;
  const e164 = isPhoneCountry(phoneCountry) ? toE164(phone, phoneCountry) : null;
  if (!e164) return NextResponse.json({ error: "invalid", fields: ["phone"] }, { status: 422 });

  const outcome = await completeSignUp(
    { ticket, name, phone: e164 },
    { clientIp: ip, userAgent: request.headers.get("user-agent") ?? undefined },
  );
  if (!outcome.ok) {
    const status = outcome.reason === "busy" ? 429 : outcome.reason === "expired" ? 401 : 503;
    const response = NextResponse.json({ error: outcome.reason }, { status });
    if (outcome.reason === "expired") clearSignUpCookie(response);
    return response;
  }
  const response = NextResponse.json({ status: "signed-in" });
  setSessionCookie(response, outcome.session);
  clearSignUpCookie(response);
  return response;
}
