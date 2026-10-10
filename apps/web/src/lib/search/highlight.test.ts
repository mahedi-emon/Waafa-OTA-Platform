import { describe, expect, it } from "vitest";
import { highlight, matchesQuery } from "./highlight";

describe("highlight", () => {
  it("splits around the first case-insensitive match", () => {
    expect(highlight("Kuala Lumpur", "kua")).toEqual({
      before: "",
      match: "Kua",
      after: "la Lumpur",
    });
    expect(highlight("Cox’s Bazar", "bazar")).toEqual({
      before: "Cox’s ",
      match: "Bazar",
      after: "",
    });
  });

  it("returns the whole text when nothing matches or the query is blank", () => {
    expect(highlight("Dubai", "xyz")).toEqual({ before: "Dubai", match: "", after: "" });
    expect(highlight("Dubai", "  ")).toEqual({ before: "Dubai", match: "", after: "" });
  });
});

describe("matchesQuery", () => {
  it("matches every word in any order", () => {
    expect(matchesQuery("DXB Dubai United Arab Emirates", "emirates dub")).toBe(true);
    expect(matchesQuery("DXB Dubai United Arab Emirates", "doha")).toBe(false);
    expect(matchesQuery("anything", "")).toBe(true);
  });
});
