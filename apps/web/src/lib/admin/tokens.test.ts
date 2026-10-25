import { describe, expect, it } from "vitest";
import {
  isAdminApiPath,
  isAdminPath,
  isSignInPath,
  safeNext,
  secondsLeft,
  sessionCookies,
} from "./tokens";

const jwt = (payload: object) =>
  `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;

describe("admin session tokens (D129)", () => {
  it("reads the seconds left on an access token", () => {
    const now = Date.UTC(2026, 9, 11, 0, 0, 0);
    expect(secondsLeft(jwt({ exp: now / 1000 + 600 }), now)).toBe(600);
    expect(secondsLeft(jwt({ exp: now / 1000 - 5 }), now)).toBe(-5);
    expect(secondsLeft(undefined, now)).toBe(0);
    expect(secondsLeft("not-a-token", now)).toBe(0);
  });

  it("matches admin paths with or without the locale prefix", () => {
    expect(isAdminPath("/secure-admin-control")).toBe(true);
    expect(isAdminPath("/en/secure-admin-control/leads/abc")).toBe(true);
    expect(isAdminPath("/secure-admin-controller")).toBe(false);
    // #85: the old guessable path is not an admin path any more.
    expect(isAdminPath("/admin")).toBe(false);
    expect(isAdminApiPath("/secure-admin-control/api/media")).toBe(true);
    expect(isAdminApiPath("/en/secure-admin-control/api/inbox")).toBe(true);
    expect(isAdminApiPath("/secure-admin-control/media")).toBe(false);
    expect(isAdminPath("/en/admin/leads")).toBe(false);
    expect(isSignInPath("/secure-admin-control/sign-in")).toBe(true);
    expect(isSignInPath("/secure-admin-control/sign-in/extra")).toBe(false);
    // The welcome page from an invite email works signed out too, and is never a place to return to.
    expect(isSignInPath("/en/secure-admin-control/welcome")).toBe(true);
    expect(safeNext("/secure-admin-control/welcome")).toBe("/secure-admin-control");
  });

  it("only sends people back to admin pages after signing in", () => {
    expect(safeNext("/secure-admin-control/leads?view=mine")).toBe(
      "/secure-admin-control/leads?view=mine",
    );
    expect(safeNext("https://evil.example/admin")).toBe("/secure-admin-control");
    expect(safeNext("//evil.example/admin")).toBe("/secure-admin-control");
    expect(safeNext("/secure-admin-control/sign-in")).toBe("/secure-admin-control");
    expect(safeNext(undefined)).toBe("/secure-admin-control");
  });

  it("keeps the refresh cookie past the browser session only when asked", () => {
    const tokens = {
      accessToken: "a",
      accessExpiresAt: "2026-10-11T00:15:00.000Z",
      refreshToken: "r",
      refreshExpiresAt: "2026-10-18T00:00:00.000Z",
    };
    const [access, refresh] = sessionCookies(tokens, false);
    expect(access?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(refresh?.options).not.toHaveProperty("expires");
    expect(sessionCookies(tokens, true)[1]?.options.expires?.toISOString()).toBe(
      "2026-10-18T00:00:00.000Z",
    );
  });
});
