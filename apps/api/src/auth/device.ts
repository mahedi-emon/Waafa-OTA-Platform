import { createHash } from "node:crypto";

/** How long "Trust this device" skips the code step (issue 234). */
export const TRUST_DAYS = 30;

/**
 * The stored id of a browser: the SHA-256 of its httpOnly device cookie, or of its user agent when a caller sends no
 * cookie (then every browser of the same make counts as one device, which errs on the side of fewer emails, never on
 * skipping a code: trust needs the cookie).
 */
export function deviceHashOf(device: string | undefined, userAgent: string | undefined): string {
  const source = device ? `device:${device}` : `ua:${userAgent ?? "unknown"}`;
  return createHash("sha256").update(source).digest("hex");
}

const BROWSERS: Array<[RegExp, string]> = [
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\b(?:OPR|Opera)\//, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\b(?:Firefox|FxiOS)\//, "Firefox"],
  [/\b(?:Chrome|CriOS)\//, "Chrome"],
  [/\bVersion\/[\d.]+.*Safari\//, "Safari"],
];

const SYSTEMS: Array<[RegExp, string]> = [
  [/\bAndroid\b/, "Android"],
  [/\biPhone\b/, "iPhone"],
  [/\biPad\b/, "iPad"],
  [/\bWindows\b/, "Windows"],
  [/\bMac OS X\b|\bMacintosh\b/, "Mac"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bLinux\b/, "Linux"],
];

/** "Chrome on Windows" from a user agent; plain words for the sign-in history and the new-device email. */
export function deviceLabel(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown device";
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "Unknown device";
}
