import { describe, expect, it } from "vitest";
import { isIndexable, recordRobots } from "./indexing";

describe("isIndexable (issue 183)", () => {
  it("indexes a published record, Sample or not", () => {
    expect(isIndexable({ sample: false, seo: { noIndex: false } })).toBe(true);
    expect(isIndexable({ sample: true, seo: { noIndex: false } })).toBe(true);
    expect(isIndexable({ sample: true })).toBe(true);
  });

  it("respects the admin's SEO › noindex", () => {
    expect(isIndexable({ sample: false, seo: { noIndex: true } })).toBe(false);
    expect(isIndexable({ sample: true, seo: { noIndex: true } })).toBe(false);
  });
});

describe("recordRobots", () => {
  it("adds nothing for an indexable record, so the layout's index, follow applies", () => {
    expect(recordRobots({ sample: true, seo: { noIndex: false } })).toEqual({});
  });

  it("sends noindex, follow for a record the admin set to noindex", () => {
    expect(recordRobots({ sample: false, seo: { noIndex: true } })).toEqual({
      robots: { index: false, follow: true },
    });
  });
});
