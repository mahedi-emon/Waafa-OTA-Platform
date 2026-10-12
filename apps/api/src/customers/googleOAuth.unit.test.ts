import { describe, expect, it } from "vitest";
import {
  GoogleSignInError,
  decodeJwtPayload,
  exchangeGoogleCode,
  identityFromClaims,
  type GoogleFetch,
} from "./googleOAuth";

const CLIENT_ID = "123-abc.apps.googleusercontent.com";
const NOW = Date.parse("2026-10-12T10:00:00Z");

const jwt = (claims: Record<string, unknown>) =>
  `e30.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.sig`;

const goodClaims = {
  iss: "https://accounts.google.com",
  aud: CLIENT_ID,
  exp: NOW / 1000 + 3600,
  sub: "1098",
  email: "Rahim@Example.com",
  email_verified: true,
  name: "Rahim Uddin",
};

describe("Google ID token claims (issue 134)", () => {
  it("returns the identity with a lower-case email", () => {
    expect(identityFromClaims(goodClaims, CLIENT_ID, NOW)).toEqual({
      sub: "1098",
      email: "rahim@example.com",
      name: "Rahim Uddin",
    });
  });

  it.each([
    ["another issuer", { iss: "https://evil.example.com" }],
    ["another client", { aud: "other.apps.googleusercontent.com" }],
    ["an expired token", { exp: NOW / 1000 - 3600 }],
    ["an unverified email", { email_verified: false }],
    ["no email", { email: undefined }],
    ["no subject", { sub: "" }],
  ])("refuses %s", (_label, change) => {
    expect(() => identityFromClaims({ ...goodClaims, ...change }, CLIENT_ID, NOW)).toThrow(
      GoogleSignInError,
    );
  });

  it("names the customer from the email when Google sends no name", () => {
    expect(identityFromClaims({ ...goodClaims, name: undefined }, CLIENT_ID, NOW).name).toBe(
      "rahim",
    );
  });

  it("reads a JWT payload and refuses anything else", () => {
    expect(decodeJwtPayload(jwt({ a: 1 }))).toEqual({ a: 1 });
    expect(() => decodeJwtPayload("not-a-jwt")).toThrow(GoogleSignInError);
    expect(() => decodeJwtPayload("a.bm90IGpzb24.c")).toThrow(GoogleSignInError);
  });
});

describe("Google code exchange (issue 134)", () => {
  const params = {
    clientId: CLIENT_ID,
    clientSecret: "secret",
    code: "4/0Ab",
    codeVerifier: "v".repeat(64),
    redirectUri: "https://waafasworld.com/api/auth/google/callback",
  };

  it("posts the code, verifier and secret as a form and reads the ID token", async () => {
    let sent: URLSearchParams | undefined;
    const fetcher: GoogleFetch = async (url, init) => {
      expect(url).toBe("https://oauth2.googleapis.com/token");
      sent = new URLSearchParams(String(init.body));
      return Response.json({ id_token: jwt(goodClaims), access_token: "unused" });
    };
    const identity = await exchangeGoogleCode(fetcher, params, NOW);
    expect(identity.email).toBe("rahim@example.com");
    expect(sent?.get("grant_type")).toBe("authorization_code");
    expect(sent?.get("code_verifier")).toBe(params.codeVerifier);
    expect(sent?.get("client_secret")).toBe("secret");
    expect(sent?.get("redirect_uri")).toBe(params.redirectUri);
  });

  it("turns a refusal, a network error or a missing token into GoogleSignInError", async () => {
    const refused: GoogleFetch = async () =>
      Response.json({ error: "invalid_grant" }, { status: 400 });
    const offline: GoogleFetch = async () => Promise.reject(new Error("ECONNRESET"));
    const empty: GoogleFetch = async () => Response.json({ access_token: "x" });
    for (const fetcher of [refused, offline, empty]) {
      await expect(exchangeGoogleCode(fetcher, params, NOW)).rejects.toBeInstanceOf(
        GoogleSignInError,
      );
    }
  });
});
