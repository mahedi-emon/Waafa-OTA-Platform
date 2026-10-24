import { describe, expect, it } from "vitest";
import { wordFilter } from "./commandFilter";

describe("wordFilter (D0 R7 link picker)", () => {
  it("matches typed words, not letters spread across words", () => {
    expect(wordFilter("Thailand Visa country thailand", "thai")).toBe(1);
    expect(wordFilter("International Trading /shop/international-trading", "thai")).toBe(0);
    expect(wordFilter("Kathmandu and Pokhara, mountain views", "thai")).toBe(0);
  });

  it("ranks word starts above matches inside a word, and needs every word", () => {
    expect(wordFilter("Group fares /flights/group-fares", "fares")).toBe(1);
    expect(wordFilter("Airfares guide", "fares")).toBe(0.5);
    expect(wordFilter("Global Bali", "bali")).toBe(1);
    expect(wordFilter("Group fares", "group fares")).toBe(1);
    expect(wordFilter("Group fares", "group hotels")).toBe(0);
  });

  it("reads keywords and treats an empty search as a match", () => {
    expect(wordFilter("Bali temples", "escape", ["bali-escape"])).toBe(1);
    expect(wordFilter("Bali temples", "scape", ["bali-escape"])).toBe(0.5);
    expect(wordFilter("Anything", "  ")).toBe(1);
  });
});
