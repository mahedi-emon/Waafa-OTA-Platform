import { describe, expect, it } from "vitest";
import { deviceHashOf, deviceLabel } from "./device";
import {
  base32Decode,
  base32Encode,
  hashRecoveryCode,
  hotp,
  looksLikeRecoveryCode,
  newRecoveryCodes,
  newTotpSecret,
  otpauthUrl,
  totpCode,
  totpStep,
  verifyTotp,
} from "./totp";

describe("TOTP (RFC 6238)", () => {
  // RFC 6238 appendix B, SHA-1 seed "12345678901234567890", 8 digits.
  const seed = Buffer.from("12345678901234567890", "ascii");
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ])("matches the RFC vector at %i s", (seconds, expected) => {
    expect(hotp(seed, totpStep(seconds * 1000), 8)).toBe(expected);
  });

  it("round-trips base32 and makes 160-bit secrets", () => {
    expect(base32Decode(base32Encode(seed)).toString("ascii")).toBe("12345678901234567890");
    expect(base32Encode(seed)).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    const secret = newTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
    expect(base32Decode("gezd gnbv-gy3t")).toEqual(base32Decode("GEZDGNBVGY3T"));
    expect(() => base32Decode("not base32!")).toThrow();
  });

  it("accepts the current code and one step of drift either side, nothing older", () => {
    const secret = newTotpSecret();
    const now = Date.UTC(2026, 9, 26, 10, 0, 15);
    const step = totpStep(now);
    expect(verifyTotp(secret, totpCode(secret, now), { now })).toBe(step);
    expect(verifyTotp(secret, totpCode(secret, now - 30_000), { now })).toBe(step - 1);
    expect(verifyTotp(secret, totpCode(secret, now + 30_000), { now })).toBe(step + 1);
    expect(verifyTotp(secret, totpCode(secret, now - 60_000), { now })).toBeNull();
    expect(verifyTotp(secret, "12345", { now })).toBeNull();
    expect(verifyTotp(secret, "abcdef", { now })).toBeNull();
    // Spaces as an app shows them ("123 456") are fine.
    const code = totpCode(secret, now);
    expect(verifyTotp(secret, `${code.slice(0, 3)} ${code.slice(3)}`, { now })).toBe(step);
  });

  it("refuses a code that was already used (replay)", () => {
    const secret = newTotpSecret();
    const now = Date.UTC(2026, 9, 26, 10, 0, 15);
    const code = totpCode(secret, now);
    const used = verifyTotp(secret, code, { now });
    expect(verifyTotp(secret, code, { now, lastUsedStep: used })).toBeNull();
    // The next step's code still works.
    expect(verifyTotp(secret, totpCode(secret, now + 30_000), { now, lastUsedStep: used })).toBe(
      (used ?? 0) + 1,
    );
  });

  it("builds the link authenticator apps read", () => {
    const url = otpauthUrl("JBSWY3DPEHPK3PXP", "owner@example.com");
    expect(url).toBe(
      "otpauth://totp/Waafa%20Admin:owner%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Waafa+Admin&algorithm=SHA1&digits=6&period=30",
    );
  });
});

describe("recovery codes", () => {
  it("makes ten distinct readable codes and hashes them however they are typed", () => {
    const codes = newRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[2-9A-HJKMNP-Z]{5}-[2-9A-HJKMNP-Z]{5}-[2-9A-HJKMNP-Z]{5}$/);
      expect(looksLikeRecoveryCode(code)).toBe(true);
    }
    const [first = ""] = codes;
    expect(hashRecoveryCode(first.toLowerCase().replaceAll("-", " "))).toBe(
      hashRecoveryCode(first),
    );
    expect(looksLikeRecoveryCode("123456")).toBe(false);
  });
});

describe("devices", () => {
  it("names browsers in plain words", () => {
    expect(
      deviceLabel(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
      ),
    ).toBe("Chrome on Windows");
    expect(
      deviceLabel(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari on iPhone");
    expect(
      deviceLabel(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 Edg/141.0",
      ),
    ).toBe("Edge on Windows");
    expect(
      deviceLabel("Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0"),
    ).toBe("Firefox on Android");
    expect(deviceLabel(undefined)).toBe("Unknown device");
    expect(deviceLabel("curl/8.0")).toBe("Unknown device");
  });

  it("hashes the device cookie, or the user agent without one", () => {
    expect(deviceHashOf("abc", "ua")).toBe(deviceHashOf("abc", "other ua"));
    expect(deviceHashOf(undefined, "ua")).not.toBe(deviceHashOf("ua", "ua"));
    expect(deviceHashOf("abc", "ua")).toMatch(/^[0-9a-f]{64}$/);
  });
});
