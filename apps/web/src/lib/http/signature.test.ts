import { describe, expect, it } from "vitest";
import { signBody, verifySignature } from "./signature";

describe("revalidation signature", () => {
  const secret = "test-revalidate-secret-0123456789";
  const body = JSON.stringify({ keys: ["faqs"], at: "2026-10-11T01:00:00.000Z" });

  it("accepts the API's HMAC and nothing else", () => {
    const signature = signBody(body, secret);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(verifySignature(body, signature, secret)).toBe(true);
    expect(verifySignature(`${body} `, signature, secret)).toBe(false);
    expect(verifySignature(body, signBody(body, "another-secret-0123456789"), secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, "zz", secret)).toBe(false);
  });
});
