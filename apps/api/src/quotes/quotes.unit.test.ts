import { describe, expect, it } from "vitest";
import { quoteIdOf, quoteToken } from "./quoteLink";
import { renderQuotePdf } from "./quotePdf";

const SECRET = "test-jwt-secret-0123456789-0123456789-abc";

describe("quote links (issue 298)", () => {
  it("names the quote when the signature is right", () => {
    const token = quoteToken("clquote0000000000000001", SECRET);
    expect(token).toMatch(/^clquote0000000000000001-[A-Za-z0-9_-]{32}$/);
    expect(quoteIdOf(token, SECRET)).toBe("clquote0000000000000001");
  });

  it("refuses another quote's signature, another secret and malformed links", () => {
    const token = quoteToken("clquote0000000000000001", SECRET);
    const signature = token.slice("clquote0000000000000001-".length);
    expect(quoteIdOf(`clquote0000000000000002-${signature}`, SECRET)).toBeNull();
    expect(quoteIdOf(token, `${SECRET}-rotated`)).toBeNull();
    expect(quoteIdOf("clquote0000000000000001", SECRET)).toBeNull();
    expect(quoteIdOf(`${token}x`, SECRET)).toBeNull();
    expect(quoteIdOf("../etc/passwd-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", SECRET)).toBeNull();
  });
});

describe("quote PDF (issue 298)", () => {
  it("renders an A4 PDF with the reference in its title", async () => {
    const pdf = await renderQuotePdf({
      reference: "QTN-261031-0001",
      issuedAt: new Date("2026-10-31T06:00:00Z"),
      customerName: "Sample Customer",
      summary: "DAC → DXB · One way · 14 Nov 2026 · 1 adult · Economy",
      validUntil: "2026-11-03",
      options: [
        {
          id: "o1",
          title: "Direct flight",
          details: "Evening departure",
          baggage: "30 kg checked",
          price: 146480,
        },
        { id: "o2", title: "One stop", details: null, baggage: null, price: 88200 },
      ],
      notes: "Prices hold until the day above.",
      acceptedOptionId: "o1",
      contact: { phone: "01700-000000", email: "hello@example.com", website: "example.com" },
    });
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("/MediaBox [0 0 595.28 841.89]");
    expect(pdf.length).toBeGreaterThan(10_000);
    expect(pdf.length).toBeLessThan(600_000);
  });
});
