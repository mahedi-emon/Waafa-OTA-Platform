import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA256 of the body with the shared secret, hex (the API signs revalidation calls the same way). */
export function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Constant-time check of a hex signature; false for a missing, malformed or wrong one. */
export function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const expected = Buffer.from(signBody(body, secret), "hex");
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
