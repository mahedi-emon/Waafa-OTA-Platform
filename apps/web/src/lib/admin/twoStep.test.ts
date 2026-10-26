import { describe, expect, it } from "vitest";
import {
  decodePending,
  encodePending,
  groupedKey,
  isDeviceId,
  newDeviceId,
  qrRows,
  twoStepCookieOptions,
} from "./twoStep";

describe("two-step sign-in on the web (issue 234)", () => {
  it("keeps the pending step in a cookie and reads back only a valid one", () => {
    const pending = {
      step: "code" as const,
      challenge: "header.payload.signature",
      remember: true,
      next: "/secure-admin-control/leads",
    };
    expect(decodePending(encodePending(pending))).toEqual(pending);
    expect(decodePending(undefined)).toBeNull();
    expect(decodePending("not base64 json")).toBeNull();
    expect(
      decodePending(
        Buffer.from(JSON.stringify({ step: "other", challenge: "x", next: "/" })).toString(
          "base64url",
        ),
      ),
    ).toBeNull();
  });

  it("scopes the step cookie to the sign-in page for five minutes", () => {
    const now = Date.UTC(2026, 9, 26, 10, 0, 0);
    const options = twoStepCookieOptions(now);
    expect(options.path).toBe("/secure-admin-control/sign-in");
    expect(options.httpOnly).toBe(true);
    expect(options.expires.getTime() - now).toBe(5 * 60_000);
  });

  it("makes random device ids and refuses anything else", () => {
    const id = newDeviceId();
    expect(isDeviceId(id)).toBe(true);
    expect(newDeviceId()).not.toBe(id);
    expect(isDeviceId("short")).toBe(false);
    expect(isDeviceId("has spaces in it that are not allowed")).toBe(false);
    expect(isDeviceId(undefined)).toBe(false);
  });

  it("groups the key in fours for typing by hand", () => {
    expect(groupedKey("JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP")).toBe(
      "JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP",
    );
  });

  it("draws a square QR matrix with a quiet border", () => {
    const rows = qrRows("otpauth://totp/Waafa%20Admin:owner%40example.com?secret=JBSWY3DPEHPK3PXP");
    expect(rows.length).toBeGreaterThan(20);
    for (const row of rows) {
      expect(row).toHaveLength(rows.length);
      expect(row).toMatch(/^[01]+$/);
    }
    expect(rows[0]).toMatch(/^0+$/);
    expect(rows[1]).toMatch(/^0+$/);
  });
});
