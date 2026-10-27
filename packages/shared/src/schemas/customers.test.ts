import { describe, expect, it } from "vitest";
import {
  AccountViewSchema,
  EmailCodeRequestSchema,
  EmailCodeResultSchema,
  EmailCodeVerifySchema,
  GoogleSignInInputSchema,
  PkceVerifierSchema,
  SignUpCompleteSchema,
  TravellerInputSchema,
} from "./customers";

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

  it("describes My account with its sections (issue 278)", () => {
    const parsed = AccountViewSchema.parse({
      customer: {
        id: "c1",
        name: "Rahim",
        email: "rahim@example.com",
        phone: null,
        createdAt: "2026-10-12T10:00:00.000Z",
      },
      hasPassword: false,
      preferences: { notifyOffers: true },
      requests: [
        {
          reference: "FLT-0001",
          module: "flights",
          status: "new",
          summary: "Dhaka to Dubai",
          createdAt: "2026-10-12T10:00:00.000Z",
          respondedAt: null,
          closedAt: null,
          visa: null,
        },
      ],
      orders: [],
      wishlist: [{ kind: "package", slug: "bangkok-and-phuket" }],
      travellers: [
        {
          id: "t1",
          fullName: "Rahim Uddin",
          dateOfBirth: null,
          nationality: "BD",
          passportMasked: "•••• 4821",
          passportExpiry: null,
        },
      ],
      addresses: [],
      signIns: [],
    });
    expect(parsed.requests).toHaveLength(1);
  });

  it("never takes a whole passport number in a traveller view, and checks the number's form on input", () => {
    expect(
      TravellerInputSchema.parse({ fullName: "Rahim Uddin", passportNumber: " ab1234567 " })
        .passportNumber,
    ).toBe("AB1234567");
    expect(
      TravellerInputSchema.safeParse({ fullName: "Rahim", passportNumber: "12 34" }).success,
    ).toBe(false);
  });
});

describe("email sign-in codes (issue 241, D301)", () => {
  it("trims and lower-cases the email so one address is one account", () => {
    expect(EmailCodeRequestSchema.parse({ email: "  Rahim@Example.COM " }).email).toBe(
      "rahim@example.com",
    );
    expect(EmailCodeRequestSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(EmailCodeRequestSchema.safeParse({ email: `${"a".repeat(250)}@x.co` }).success).toBe(
      false,
    );
  });

  it("takes exactly six digits", () => {
    const base = { email: "a@b.co" };
    expect(EmailCodeVerifySchema.safeParse({ ...base, code: "123456" }).success).toBe(true);
    expect(EmailCodeVerifySchema.safeParse({ ...base, code: " 123456 " }).success).toBe(true);
    for (const code of ["12345", "1234567", "12a456", "", "١٢٣٤٥٦"])
      expect(EmailCodeVerifySchema.safeParse({ ...base, code }).success, code).toBe(false);
  });

  it("answers with a session or a sign-up ticket, nothing else", () => {
    expect(EmailCodeResultSchema.safeParse({ status: "new", ticket: "t".repeat(43) }).success).toBe(
      true,
    );
    expect(EmailCodeResultSchema.safeParse({ status: "new", ticket: "short" }).success).toBe(false);
    expect(EmailCodeResultSchema.safeParse({ status: "exists" }).success).toBe(false);
  });

  it("finishes sign-up with a name and an E.164 phone", () => {
    const ticket = "t".repeat(43);
    expect(
      SignUpCompleteSchema.safeParse({ ticket, name: "Rahim Uddin", phone: "+8801712345678" })
        .success,
    ).toBe(true);
    expect(
      SignUpCompleteSchema.safeParse({ ticket, name: "R", phone: "+8801712345678" }).success,
    ).toBe(false);
    expect(
      SignUpCompleteSchema.safeParse({ ticket, name: "Rahim", phone: "01712345678" }).success,
    ).toBe(false);
  });
});
