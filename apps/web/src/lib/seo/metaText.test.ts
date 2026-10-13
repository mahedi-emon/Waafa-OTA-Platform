import { describe, expect, it } from "vitest";
import { clampText, DESCRIPTION_MAX, fitTitle, TITLE_MAX } from "./metaText";

describe("clampText", () => {
  it("keeps text that fits", () => {
    expect(clampText("Dhaka to Dubai flights", 60)).toBe("Dhaka to Dubai flights");
  });

  it("collapses whitespace from admin text", () => {
    expect(clampText("  Visa   help\nfrom Dhaka ", 60)).toBe("Visa help from Dhaka");
  });

  it("cuts at a word boundary and ends with an ellipsis", () => {
    const long =
      "Thailand visa from Bangladesh: the documents you need, the embassy fee, how long it takes and how we help you apply.";
    const short = clampText(long, 60);
    expect(short.length).toBeLessThanOrEqual(60);
    expect(short.endsWith("…")).toBe(true);
    expect(short).toBe("Thailand visa from Bangladesh: the documents you need, the…");
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(clampText("Flights, hotels, tours, visas, and much more besides", 30)).toBe(
      "Flights, hotels, tours, visas…",
    );
  });

  it("cuts inside a very long word rather than returning almost nothing", () => {
    const short = clampText("a".repeat(80), 20);
    expect(short).toHaveLength(20);
  });

  it("never exceeds the description limit", () => {
    const text = "word ".repeat(80);
    expect(clampText(text, DESCRIPTION_MAX).length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });
});

describe("fitTitle", () => {
  const template = "%s | Waafa";

  it("keeps the template when the whole title fits in 60 characters", () => {
    expect(fitTitle("Dhaka to Dubai flights", template)).toEqual({
      title: "Dhaka to Dubai flights",
      absolute: false,
    });
  });

  it("drops the template when it would push the title past 60", () => {
    const title = "Malaysia eVisa for Bangladeshis: apply online, step by step"; // 59
    expect(fitTitle(title, template)).toEqual({ title, absolute: true });
  });

  it("shortens a page title that is too long on its own", () => {
    const result = fitTitle(
      "Indian visa for medical treatment: hospital letters, attendants and timing",
      template,
    );
    expect(result.absolute).toBe(true);
    expect(result.title.length).toBeLessThanOrEqual(TITLE_MAX);
  });
});
