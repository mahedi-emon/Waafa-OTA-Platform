import { describe, expect, it } from "vitest";
import { mentionQuery } from "./mentionQuery";

describe("mentionQuery (issue 243)", () => {
  it("reads the name being typed after @", () => {
    expect(mentionQuery("Please ask @Tan", 15)).toEqual({ start: 11, query: "Tan" });
    expect(mentionQuery("@Tanvir Al", 10)).toEqual({ start: 0, query: "Tanvir Al" });
  });

  it("ignores email addresses, finished lines and text without @", () => {
    expect(mentionQuery("desk@waafa", 10)).toBeNull();
    expect(mentionQuery("@Tanvir\nnext", 12)).toBeNull();
    expect(mentionQuery("no mention", 10)).toBeNull();
  });
});
