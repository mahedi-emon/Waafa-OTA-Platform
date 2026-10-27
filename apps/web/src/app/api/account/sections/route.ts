import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { accountWrite } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";
import { isSameSite, readCappedBody } from "@/lib/http/readCappedBody";
import { isPhoneCountry, toE164 } from "@/lib/leads/phone";
import { clientKey, createRateLimiter } from "@/lib/rateLimit";

const allow = createRateLimiter({ limit: 30, windowMs: 60_000 });
const ID = /^[a-z0-9]{10,40}$/;

/** Each change My account can make, and the API path it goes to (issue 278). Anything else is refused. */
const OPS: Record<string, (id: string) => string> = {
  "wishlist.add": () => "wishlist",
  "wishlist.remove": () => "wishlist/remove",
  "traveller.add": () => "travellers",
  "traveller.update": (id) => `travellers/${id}`,
  "traveller.remove": (id) => `travellers/${id}/remove`,
  "address.add": () => "addresses",
  "address.update": (id) => `addresses/${id}`,
  "address.remove": (id) => `addresses/${id}/remove`,
  preferences: () => "preferences",
  signOutOthers: () => "sign-out-others",
  "password.set": () => "password",
  "password.remove": () => "password/remove",
};
const NEEDS_ID = new Set([
  "traveller.update",
  "traveller.remove",
  "address.update",
  "address.remove",
]);

/** An address form sends the phone as typed with its country; the API keeps E.164. */
function withE164(data: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof data.phone !== "string") return data;
  const country = typeof data.phoneCountry === "string" ? data.phoneCountry : "BD";
  const e164 = isPhoneCountry(country) ? toE164(data.phone, country) : null;
  if (!e164) return null;
  const { phoneCountry: _country, ...rest } = data;
  return { ...rest, phone: e164 };
}

/**
 * My account changes (issue 278): same-site only, capped, limited per visitor, sent with the session cookie. A
 * refusal the form explains (signed out, a field, a full list) answers 200 with `ok: false`; the form says what to do.
 */
export async function POST(request: Request) {
  if (!isSameSite(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ip = clientKey(request.headers);
  if (!allow(`account:${ip}`)) return NextResponse.json({ error: "busy" }, { status: 429 });
  const text = await readCappedBody(request, 4_000);
  if (text === null) return NextResponse.json({ error: "invalid" }, { status: 413 });
  let body: { op?: unknown; id?: unknown; data?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const op = typeof body.op === "string" ? body.op : "";
  const path = OPS[op];
  const id = typeof body.id === "string" ? body.id : "";
  if (!path || (NEEDS_ID.has(op) && !ID.test(id))) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  let data =
    body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
  if (op.startsWith("address.") && op !== "address.remove") {
    const converted = withE164(data);
    if (!converted) return NextResponse.json({ ok: false, error: "invalid", fields: ["phone"] });
    data = converted;
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const outcome = await accountWrite(path(id), token, data);
  if (outcome.ok) return NextResponse.json({ ok: true, ...outcome.body });
  if (outcome.status === 429) return NextResponse.json({ error: "busy" }, { status: 429 });
  const fields = Array.isArray(outcome.body.fields)
    ? (outcome.body.fields as Array<{ path?: unknown }>).map((field) => String(field.path ?? ""))
    : [];
  const error =
    outcome.status === 401
      ? "signed-out"
      : outcome.status === 409
        ? "full"
        : outcome.status === 422
          ? "invalid"
          : outcome.status === 404
            ? "missing"
            : "unavailable";
  return NextResponse.json({ ok: false, error, fields });
}
