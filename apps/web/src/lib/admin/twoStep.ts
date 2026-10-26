import { randomBytes } from "node:crypto";
import { encode } from "uqr";

/*
 * Two-step sign-in on the web side (issue 234). The API checks every code; this server keeps two httpOnly cookies:
 * the browser's device id (new-device emails and "Trust this device for 30 days") and the 5-minute challenge between
 * the password and the code. The browser never sees the challenge.
 */

/** A random id per browser, kept 400 days (the longest a browser keeps a cookie). */
export const DEVICE_COOKIE = "waafa_admin_device";
/** The step after a correct password: the API's challenge, which step, and the sign-in choices. */
export const TWO_STEP_COOKIE = "waafa_admin_two_step";

const DEVICE_DAYS = 400;
export const TWO_STEP_MINUTES = 5;

export function newDeviceId(): string {
  return randomBytes(24).toString("base64url");
}

export function isDeviceId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{22,64}$/.test(value);
}

const base = () => ({
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

export function deviceCookieOptions(now = Date.now()) {
  return { ...base(), expires: new Date(now + DEVICE_DAYS * 86_400_000) };
}

export type PendingTwoStep = {
  step: "code" | "enrol";
  challenge: string;
  remember: boolean;
  next: string;
};

export function twoStepCookieOptions(now = Date.now()) {
  // Site-wide path so the sign-in page works under any locale prefix; it lasts five minutes.
  return {
    ...base(),
    path: "/",
    expires: new Date(now + TWO_STEP_MINUTES * 60_000),
  };
}

export function encodePending(pending: PendingTwoStep): string {
  return Buffer.from(JSON.stringify(pending), "utf8").toString("base64url");
}

export function decodePending(value: string | undefined): PendingTwoStep | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<PendingTwoStep>;
    if (
      (parsed.step === "code" || parsed.step === "enrol") &&
      typeof parsed.challenge === "string" &&
      typeof parsed.next === "string"
    ) {
      return {
        step: parsed.step,
        challenge: parsed.challenge,
        remember: parsed.remember === true,
        next: parsed.next,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * The QR code for an authenticator app as rows of "1" (dark) and "0" (light), made on the server so no QR library
 * reaches the browser; `QrCode` draws it.
 */
export function qrRows(text: string): string[] {
  const { data } = encode(text, { ecc: "M", border: 2 });
  return data.map((row) => row.map((dark) => (dark ? "1" : "0")).join(""));
}

/** "JBSW Y3DP EHPK 3PXP": the key in groups of four, easier to type into an app by hand. */
export function groupedKey(secret: string): string {
  return secret.replace(/(.{4})(?=.)/g, "$1 ");
}
