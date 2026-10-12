import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  authorizeUrl,
  decodePending,
  encodePending,
  newPkce,
  newState,
  safeNext,
} from "./googleOAuth";

describe("Google sign-in helpers (issue 134)", () => {
  it("makes an RFC 7636 verifier and its S256 challenge", () => {
    const { verifier, challenge } = newPkce();
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]{64}$/);
    expect(challenge).toBe(createHash("sha256").update(verifier).digest("base64url"));
    expect(newPkce().verifier).not.toBe(verifier);
    expect(newState()).not.toBe(newState());
  });

  it("builds Google's authorize address with PKCE, state and the minimal scopes", () => {
    const url = new URL(
      authorizeUrl({
        clientId: "123.apps.googleusercontent.com",
        redirectUri: "https://waafasworld.com/api/auth/google/callback",
        state: "s1",
        challenge: "c1",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: "123.apps.googleusercontent.com",
      redirect_uri: "https://waafasworld.com/api/auth/google/callback",
      response_type: "code",
      scope: "openid email profile",
      state: "s1",
      code_challenge: "c1",
      code_challenge_method: "S256",
    });
  });

  it.each([
    ["/account", "/account"],
    ["/shop/cart?x=1", "/shop/cart?x=1"],
    ["https://evil.example.com", "/account"],
    ["//evil.example.com", "/account"],
    ["/\\evil.example.com", "/account"],
    ["/api/auth/google/start", "/account"],
    ["/login", "/account"],
    [undefined, "/account"],
    [`/${"a".repeat(300)}`, "/account"],
  ])("sends %s to %s after sign-in", (value, expected) => {
    expect(safeNext(value)).toBe(expected);
  });

  it("round-trips the pending cookie and refuses a tampered one", () => {
    const pending = { state: "s", verifier: "v".repeat(64), next: "/visa-services" };
    expect(decodePending(encodePending(pending))).toEqual(pending);
    expect(decodePending(encodePending({ ...pending, next: "//evil.example.com" }))?.next).toBe(
      "/account",
    );
    expect(decodePending("not-json")).toBeNull();
    expect(decodePending(undefined)).toBeNull();
    expect(decodePending(Buffer.from('{"state":1}').toString("base64url"))).toBeNull();
  });
});
