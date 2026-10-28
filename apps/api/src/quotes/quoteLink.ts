import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The customer's quote link (issue 298): "<quote id>-<signature>", the signature an HMAC of the id with the server's
 * JWT_SECRET. Staff can copy the same link again at any time; withdrawing the quote closes it. Changing JWT_SECRET
 * retires every link (the customer asks for a new one).
 */
function signature(id: string, secret: string): string {
  return createHmac("sha256", secret).update(`quote-link:${id}`).digest("base64url").slice(0, 32);
}

export function quoteToken(id: string, secret: string): string {
  return `${id}-${signature(id, secret)}`;
}

/** The quote id a token names, when its signature is right; null otherwise. */
export function quoteIdOf(token: string, secret: string): string | null {
  const match = /^([a-z0-9]{10,40})-([A-Za-z0-9_-]{32})$/.exec(token);
  if (!match) return null;
  const [, id, given] = match as unknown as [string, string, string];
  const expected = Buffer.from(signature(id, secret));
  const presented = Buffer.from(given);
  return presented.length === expected.length && timingSafeEqual(presented, expected) ? id : null;
}
