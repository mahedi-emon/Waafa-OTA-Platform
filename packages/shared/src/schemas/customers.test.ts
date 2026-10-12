import { describe, expect, it } from "vitest";
import { AccountViewSchema, GoogleSignInInputSchema, PkceVerifierSchema } from "./customers";

describe("customer sign-in schemas (issue 134)", () => {
  it("accepts an RFC 7636 verifier and refuses short or odd ones", () => {
    expect(PkceVerifierSchema.safeParse("a".repeat(43)).success).toBe(true);
    expect(PkceVerifierSchema.safeParse("A-b.c_d~".repeat(16)).success).toBe(true);
    expect(PkceVerifierSchema.safeParse("a".repeat(42)).success).toBe(false);
    expect(PkceVerifierSchema.safeParse("a".repeat(129)).success).toBe(false);
    expect(PkceVerifierSchema.safeParse(`${"a".repeat(43)}/`).success).toBe(false);
  });

  it("takes only the code, the verifier and the redirect address", () => {
    const input = {
      code: "4/0Ab",
      codeVerifier: "v".repeat(64),
      redirectUri: "https://waafasworld.com/api/auth/google/callback",
    };
    expect(GoogleSignInInputSchema.safeParse(input).success).toBe(true);
    expect(GoogleSignInInputSchema.safeParse({ ...input, email: "x@y.z" }).success).toBe(false);
    expect(GoogleSignInInputSchema.safeParse({ ...input, redirectUri: "not a url" }).success).toBe(
      false,
    );
  });

  it("describes My account with requests and orders", () => {
    const parsed = AccountViewSchema.parse({
      customer: {
        id: "c1",
        name: "Rahim",
        email: "rahim@example.com",
        createdAt: "2026-10-12T10:00:00.000Z",
      },
      requests: [
        {
          reference: "FLT-0001",
          module: "flights",
          status: "new",
          summary: "Dhaka to Dubai",
          createdAt: "2026-10-12T10:00:00.000Z",
        },
      ],
      orders: [],
    });
    expect(parsed.requests).toHaveLength(1);
  });
});
