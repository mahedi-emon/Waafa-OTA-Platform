import { describe, expect, it } from "vitest";
import { findMentions } from "./mentions";

const people = [
  { id: "a", name: "Ayesha" },
  { id: "ar", name: "Ayesha Rahman" },
  { id: "k", name: "Kamal Hossain" },
];

describe("findMentions (issue 243)", () => {
  it("finds full names after @, once each, in the order they appear", () => {
    expect(
      findMentions("@Kamal Hossain please call; @kamal hossain again, cc @Ayesha.", people),
    ).toEqual(["k", "a"]);
  });

  it("prefers the longer name that starts the same way", () => {
    expect(findMentions("Over to @Ayesha Rahman", people)).toEqual(["ar"]);
  });

  it("ignores email addresses and names that run into a longer word", () => {
    expect(findMentions("write to desk@Ayesha.com or @Ayeshax", people)).toEqual([]);
  });

  it("finds nothing without an @", () => {
    expect(findMentions("Ayesha Rahman will call", people)).toEqual([]);
  });
});
