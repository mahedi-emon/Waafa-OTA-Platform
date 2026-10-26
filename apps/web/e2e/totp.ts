import { createHmac } from "node:crypto";

/*
 * Authenticator codes for end-to-end runs (issue 234): RFC 6238, the same as an app on a phone. The API has its own
 * checked copy (apps/api/src/auth/totp.ts); this one only makes codes.
 */
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decode(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of text.replace(/[\s=-]/g, "").toUpperCase()) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** The 6-digit code the app would show for `secret` at `at` (milliseconds). */
export function totpCode(secret: string, at: number = Date.now()): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const hmac = createHmac("sha1", decode(secret)).update(message).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const binary =
    (((hmac[offset] ?? 0) & 0x7f) << 24) |
    ((hmac[offset + 1] ?? 0) << 16) |
    ((hmac[offset + 2] ?? 0) << 8) |
    (hmac[offset + 3] ?? 0);
  return String(binary % 1_000_000).padStart(6, "0");
}
