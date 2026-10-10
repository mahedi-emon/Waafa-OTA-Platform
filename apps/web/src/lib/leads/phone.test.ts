import { describe, expect, it } from "vitest";
import { dialCode, isPhoneCountry, toE164 } from "./phone";

describe("toE164", () => {
  it("accepts Bangladeshi numbers typed the local way", () => {
    expect(toE164("01712-345678")).toBe("+8801712345678");
    expect(toE164("1712 345678")).toBe("+8801712345678");
    expect(toE164("+880 1712 345678")).toBe("+8801712345678");
  });

  it("rejects numbers with the wrong length or empty input", () => {
    expect(toE164("01712-3456")).toBeNull();
    expect(toE164("")).toBeNull();
  });

  it("uses the chosen country", () => {
    expect(toE164("050 123 4567", "AE")).toBe("+971501234567");
  });
});

describe("dialCode", () => {
  it("returns the calling code with a plus", () => {
    expect(dialCode("BD")).toBe("+880");
    expect(isPhoneCountry("BD")).toBe(true);
    expect(isPhoneCountry("ZZ")).toBe(false);
  });
});
