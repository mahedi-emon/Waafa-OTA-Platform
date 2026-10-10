import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { sanitizeRichText } = await import("./sanitizeRichText");

describe("rich text sanitiser", () => {
  it("keeps the allow-listed formatting", () => {
    expect(sanitizeRichText("<p>Hello <strong>there</strong></p><ul><li>One</li></ul>")).toBe(
      "<p>Hello <strong>there</strong></p><ul><li>One</li></ul>",
    );
  });

  it("drops scripts, event handlers, styles and javascript links", () => {
    const out = sanitizeRichText(
      '<p onclick="x()" style="color:red">Hi</p><script>alert(1)</script><a href="javascript:alert(2)">x</a><img src=x onerror=alert(3)>',
    );
    expect(out).toBe("<p>Hi</p><a>x</a>");
  });

  it("keeps simple tables with header scope but no styling attributes", () => {
    expect(
      sanitizeRichText(
        '<table style="width:9px"><thead><tr><th scope="col">Item</th><th>Cost</th></tr></thead><tbody><tr><td colspan="2" class="x">From ৳9,800</td></tr></tbody></table>',
      ),
    ).toBe(
      '<table><thead><tr><th scope="col">Item</th><th>Cost</th></tr></thead><tbody><tr><td colspan="2">From ৳9,800</td></tr></tbody></table>',
    );
  });

  it("opens external links safely and demotes page-level headings", () => {
    expect(sanitizeRichText('<h2>Fees</h2><a href="https://example.com">Embassy</a>')).toBe(
      '<h3>Fees</h3><a href="https://example.com" target="_blank" rel="noopener noreferrer">Embassy</a>',
    );
    expect(sanitizeRichText('<a href="/refund-policy" target="_blank">Refunds</a>')).toBe(
      '<a href="/refund-policy">Refunds</a>',
    );
  });
});
