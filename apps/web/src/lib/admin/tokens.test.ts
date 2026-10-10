import { describe, expect, it } from "vitest";
import { isAdminPath, isSignInPath, safeNext, secondsLeft, sessionCookies } from "./tokens";

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
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/en/admin/leads/abc")).toBe(true);
    expect(isAdminPath("/administration")).toBe(false);
    expect(isSignInPath("/admin/sign-in")).toBe(true);
    expect(isSignInPath("/admin/sign-in/extra")).toBe(false);
  });

  it("only sends people back to admin pages after signing in", () => {
    expect(safeNext("/admin/leads?view=mine")).toBe("/admin/leads?view=mine");
    expect(safeNext("https://evil.example/admin")).toBe("/admin");
    expect(safeNext("//evil.example/admin")).toBe("/admin");
    expect(safeNext("/admin/sign-in")).toBe("/admin");
    expect(safeNext(undefined)).toBe("/admin");
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
