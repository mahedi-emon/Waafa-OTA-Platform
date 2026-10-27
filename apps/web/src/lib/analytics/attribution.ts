import { LeadSourceSchema, type LeadSource } from "@waafa/shared";

/** First-party cookie with where the visitor came from (issue 237); read by the server only. */
export const SOURCE_COOKIE = "waafa_src";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

export type Attribution = NonNullable<Pick<LeadSource, "utm" | "referrer" | "landing">>;

type CookieJar = {
  get(name: string): { value: string } | undefined;
};
type CookieWriter = {
  set(
    name: string,
    value: string,
    options: { maxAge: number; httpOnly: boolean; sameSite: "lax"; secure: boolean; path: string },
  ): unknown;
};

const clip = (value: string, length: number) => value.trim().slice(0, length);
/** A cookie someone edited by hand is ignored rather than refused with the lead. */
const SavedSourceSchema = LeadSourceSchema.pick({ utm: true, referrer: true, landing: true });

/**
 * Where this visit came from: UTM parameters, or another site's address as the referrer (never our own pages).
 * Null for a direct visit or an internal move, so the first source is kept.
 */
export function sourceOf(url: URL, referer: string | null, ownHost: string): Attribution | null {
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(`utm_${key}`);
    if (value && value.trim()) utm[key] = clip(value, 100);
  }
  let referrer: string | undefined;
  if (referer) {
    try {
      const from = new URL(referer);
      const own = from.hostname === ownHost || from.hostname.endsWith(`.${ownHost}`);
      if (!own && (from.protocol === "https:" || from.protocol === "http:"))
        referrer = clip(`${from.hostname}${from.pathname === "/" ? "" : from.pathname}`, 200);
    } catch {
      referrer = undefined;
    }
  }
  if (Object.keys(utm).length === 0 && !referrer) return null;
  return {
    ...(Object.keys(utm).length > 0 ? { utm } : {}),
    ...(referrer ? { referrer } : {}),
    landing: clip(url.pathname, 200),
  };
}

/**
 * Remembers the source on the response for 30 days. A visit with UTM tags replaces an older source (the campaign that
 * brought them back); a plain referrer only fills an empty cookie.
 */
export function rememberSource(
  url: URL,
  referer: string | null,
  ownHost: string,
  cookies: CookieJar,
  response: CookieWriter,
  secure: boolean,
): void {
  const source = sourceOf(url, referer, ownHost);
  if (!source) return;
  if (!source.utm && cookies.get(SOURCE_COOKIE)) return;
  response.set(SOURCE_COOKIE, encodeURIComponent(JSON.stringify(source)), {
    maxAge: MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  });
}

/** The remembered source, or null when the cookie is missing or not ours. */
export function readSource(cookies: CookieJar): Attribution | null {
  const raw = cookies.get(SOURCE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = SavedSourceSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** An order body with the remembered source added (a "web" source); anything else is returned as it is. */
export function withSource(order: unknown, source: Attribution | null): unknown {
  if (!source || !order || typeof order !== "object" || Array.isArray(order)) return order;
  if ("source" in order) return order;
  return { ...order, source: { channel: "web", ...source } };
}
