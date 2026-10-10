import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows `limit` requests per window, per key, then resets", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1_000 });
    expect([allow("a", 0), allow("a", 10), allow("a", 20)]).toEqual([true, true, false]);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1_001)).toBe(true);
  });

  it("never grows past maxKeys", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 10_000, maxKeys: 2 });
    allow("a", 0);
    allow("b", 0);
    expect(allow("c", 0)).toBe(true);
    expect(allow("c", 1)).toBe(false);
  });
});

describe("clientKey", () => {
  it("takes the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe(
      "203.0.113.5",
    );
    expect(clientKey(new Headers())).toBe("unknown");
  });
});
