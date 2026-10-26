import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Time-based one-time codes for staff two-step sign-in (RFC 6238 with RFC 4226 truncation, issue 234): HMAC-SHA1,
 * 6 digits, 30-second steps, what every authenticator app shows by default. Written on node:crypto so the check stays
 * small and testable against the RFC vectors.
 */
export const TOTP_DIGITS = 6;
export const TOTP_STEP_SECONDS = 30;
/** One step either side covers a phone clock that is up to 30 seconds off. */
export const TOTP_DRIFT_STEPS = 1;

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Buffer {
  const clean = text.replace(/[\s=-]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Not base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new 160-bit secret (RFC 4226 recommends at least 128), base32 as apps expect it. */
export function newTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpStep(now: Date | number = Date.now()): number {
  const ms = typeof now === "number" ? now : now.getTime();
  return Math.floor(ms / 1000 / TOTP_STEP_SECONDS);
}

/** The code for one time step (RFC 4226 dynamic truncation). */
export function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(message).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const binary =
    (((hmac[offset] ?? 0) & 0x7f) << 24) |
    ((hmac[offset + 1] ?? 0) << 16) |
    ((hmac[offset + 2] ?? 0) << 8) |
    (hmac[offset + 3] ?? 0);
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function totpCode(secretBase32: string, now: Date | number = Date.now()): string {
  return hotp(base32Decode(secretBase32), totpStep(now));
}

/**
 * The time step a typed code matches, or null. Steps at or before `lastUsedStep` are refused, so a code that was
 * already used (seen over a shoulder, or sent twice) can't open a second session.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  options: { now?: Date | number; lastUsedStep?: number | null } = {},
): number | null {
  const typed = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(typed)) return null;
  const secret = base32Decode(secretBase32);
  const current = totpStep(options.now ?? Date.now());
  for (let drift = -TOTP_DRIFT_STEPS; drift <= TOTP_DRIFT_STEPS; drift += 1) {
    const step = current + drift;
    if (options.lastUsedStep !== null && options.lastUsedStep !== undefined) {
      if (step <= options.lastUsedStep) continue;
    }
    const expected = Buffer.from(hotp(secret, step));
    if (timingSafeEqual(expected, Buffer.from(typed))) return step;
  }
  return null;
}

/** The link an authenticator app reads from the QR code (Key URI format). */
export function otpauthUrl(secretBase32: string, account: string, issuer = "Waafa Admin"): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const query = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}

// Recovery codes --------------------------------------------------------------------------------------------------

/** No 0/O, 1/I/L: easy to read back from paper. */
const RECOVERY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const RECOVERY_CODE_COUNT = 10;

/** Ten one-time codes like "7KQ4M-2XD9P-RTWYZ" (about 74 bits each). */
export function newRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const chars = Array.from(
      { length: 15 },
      () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)],
    );
    return [chars.slice(0, 5), chars.slice(5, 10), chars.slice(10)]
      .map((g) => g.join(""))
      .join("-");
  });
}

/** What is stored for a recovery code: case, spaces and dashes don't matter when it is typed back. */
export function hashRecoveryCode(code: string): string {
  const clean = code.replace(/[\s-]/g, "").toUpperCase();
  return createHash("sha256").update(`waafa-recovery:${clean}`).digest("hex");
}

export function looksLikeRecoveryCode(code: string): boolean {
  return /^[A-Z0-9]{15}$/.test(code.replace(/[\s-]/g, "").toUpperCase());
}
