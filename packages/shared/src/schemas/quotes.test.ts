import { describe, expect, it } from "vitest";
import {
  isQuoteExpired,
  publicQuoteState,
  QuoteAcceptInputSchema,
  QuoteInputSchema,
  quoteOptionsOf,
  QuoteTokenSchema,
} from "./quotes";

const option = { title: "Direct flight", details: null, baggage: "30 kg", price: 146480 };

describe("quotes (issue 298)", () => {
  it("numbers the options in the order staff gave them", () => {
    expect(quoteOptionsOf([option, { ...option, price: 98500 }]).map((item) => item.id)).toEqual([
      "o1",
      "o2",
    ]);
  });

  it("takes one to five options with a title and a price, and a valid day", () => {
    const valid = { options: [option], validUntil: "2026-11-03", notes: null };
    expect(QuoteInputSchema.safeParse(valid).success).toBe(true);
    expect(QuoteInputSchema.safeParse({ ...valid, options: [] }).success).toBe(false);
    expect(QuoteInputSchema.safeParse({ ...valid, options: Array(6).fill(option) }).success).toBe(
      false,
    );
    expect(
      QuoteInputSchema.safeParse({ ...valid, options: [{ ...option, price: 0 }] }).success,
    ).toBe(false);
    expect(
      QuoteInputSchema.safeParse({ ...valid, options: [{ ...option, title: "x" }] }).success,
    ).toBe(false);
    expect(QuoteInputSchema.safeParse({ ...valid, validUntil: "3 Nov" }).success).toBe(false);
  });

  it("expires an open quote after its last day only", () => {
    expect(isQuoteExpired("sent", "2026-11-03", "2026-11-03")).toBe(false);
    expect(isQuoteExpired("sent", "2026-11-03", "2026-11-04")).toBe(true);
    expect(isQuoteExpired("accepted", "2026-11-03", "2026-11-10")).toBe(false);
    expect(publicQuoteState("sent", "2026-11-03", "2026-11-04")).toBe("expired");
    expect(publicQuoteState("withdrawn", "2026-11-03", "2026-11-01")).toBe("withdrawn");
    expect(publicQuoteState("accepted", "2026-11-03", "2026-11-10")).toBe("accepted");
    expect(publicQuoteState("sent", "2026-11-03", "2026-11-01")).toBe("open");
  });

  it("accepts only a signed link and an option id", () => {
    const token = `clquote0000000000000001-${"a".repeat(32)}`;
    expect(QuoteTokenSchema.safeParse(token).success).toBe(true);
    expect(QuoteTokenSchema.safeParse("clquote0000000000000001").success).toBe(false);
    expect(QuoteAcceptInputSchema.safeParse({ token, optionId: "o2" }).success).toBe(true);
    expect(QuoteAcceptInputSchema.safeParse({ token, optionId: "two" }).success).toBe(false);
  });
});
