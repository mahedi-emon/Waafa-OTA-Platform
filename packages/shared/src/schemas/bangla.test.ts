import { describe, expect, it } from "vitest";
import { BanglaTextSchema, banglaMissing, translatablePaths, withBangla } from "./bangla";
import { FaqSchema } from "./content";

const post = {
  id: "p1",
  slug: "thailand-visa",
  title: "Thailand visa guide",
  excerpt: "What you need",
  highlights: ["Passport", "Photo"],
  cover: { src: "/media/x.jpg", alt: "Bangkok at night" },
  sections: [{ id: "docs", heading: "Documents", body: "Bring your passport." }],
  itinerary: [{ day: 1, meals: "breakfast", title: "Arrive" }],
  seo: { title: "Thailand visa", description: "Guide" },
  status: "published",
  href: "/visa/thailand",
};

describe("bilingual content (issue 255)", () => {
  it("offers only the words visitors read, never links, slugs, enums or ids", () => {
    expect(translatablePaths(post)).toEqual([
      "title",
      "excerpt",
      "highlights.0",
      "highlights.1",
      "cover.alt",
      "sections.0.heading",
      "sections.0.body",
      "itinerary.0.title",
      "seo.title",
      "seo.description",
    ]);
  });

  it("puts Bangla in place of English where it exists and keeps English elsewhere", () => {
    const record = {
      ...post,
      bn: { title: "থাইল্যান্ড ভিসা গাইড", "sections.0.heading": "কাগজপত্র", "x.9": "নেই" },
    };
    const shown = withBangla({ items: [record], total: 1 });
    expect(shown.items[0]?.title).toBe("থাইল্যান্ড ভিসা গাইড");
    expect(shown.items[0]?.sections[0]?.heading).toBe("কাগজপত্র");
    expect(shown.items[0]?.excerpt).toBe("What you need");
    // The stored record is never changed.
    expect(record.title).toBe("Thailand visa guide");
  });

  it("finds records with Bangla missing", () => {
    expect(banglaMissing(post)).toBe(true);
    const all = Object.fromEntries(translatablePaths(post).map((path) => [path, "বাংলা"]));
    expect(banglaMissing({ ...post, bn: all })).toBe(false);
    expect(banglaMissing({ id: "x", slug: "only-codes" })).toBe(false);
  });

  it("accepts dotted field paths only, and records keep validating with bn", () => {
    expect(BanglaTextSchema.safeParse({ "sections.0.heading": "ক" }).success).toBe(true);
    expect(BanglaTextSchema.safeParse({ "../x": "ক" }).success).toBe(false);
    expect(
      FaqSchema.safeParse({
        id: "f1",
        question: "Do you book flights?",
        answer: "Yes.",
        category: "flights",
        status: "published",
        bn: { question: "আপনারা কি ফ্লাইট বুক করেন?" },
      }).error?.issues.filter((issue) => issue.path[0] === "bn") ?? [],
    ).toEqual([]);
  });
});
