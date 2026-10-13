import { describe, expect, it } from "vitest";
import { isIndexable, recordRobots } from "./indexing";

describe("isIndexable", () => {
  it("indexes a real record", () => {
    expect(isIndexable({ sample: false, seo: { noIndex: false } })).toBe(true);
    expect(isIndexable({ sample: false })).toBe(true);
  });

  it("keeps a Sample record out of the index", () => {
    expect(isIndexable({ sample: true, seo: { noIndex: false } })).toBe(false);
    expect(isIndexable({ sample: true })).toBe(false);
  });

  it("respects the admin's SEO › noindex on a real record", () => {
    expect(isIndexable({ sample: false, seo: { noIndex: true } })).toBe(false);
  });
});

describe("recordRobots", () => {
  it("adds nothing for a real record, so the layout's index, follow applies", () => {
    expect(recordRobots({ sample: false, seo: { noIndex: false } })).toEqual({});
  });

  it("sends noindex, follow for a Sample record", () => {
    expect(recordRobots({ sample: true, seo: { noIndex: false } })).toEqual({
      robots: { index: false, follow: true },
    });
  });

  it("sends noindex, follow for a noindex record", () => {
    expect(recordRobots({ sample: false, seo: { noIndex: true } })).toEqual({
      robots: { index: false, follow: true },
    });
  });

  it("indexes the record again once Sample is turned off", () => {
    const record = { sample: true, seo: { noIndex: false } };
    expect(recordRobots(record).robots).toBeDefined();
    expect(recordRobots({ ...record, sample: false })).toEqual({});
  });
});
