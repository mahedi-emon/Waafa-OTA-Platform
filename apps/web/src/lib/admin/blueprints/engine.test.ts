import { describe, expect, it } from "vitest";
import { editorSchema } from "../editorSchema";
import { applyAutomatic, camelKey, nowInDhaka, todayInDhaka } from "./automatic";
import { buildResolvedBlueprint } from "./build";
import { changesBetween } from "./diff";
import { dottedOf, pathFromDotted, pathsMatching, patternOf } from "./paths";
import { viewOfProblem } from "./problems";
import { freeId, slugify } from "./slug";
import { checkValue, validateRecord } from "./validate";

const words = () => undefined;
const NOW = new Date("2026-10-19T18:30:00Z"); // 20 Oct 2026, 00:30 in Dhaka

describe("paths", () => {
  it("names fields by pattern, list items as <list>_item", () => {
    expect(patternOf(["prices", 2, "price"])).toBe("prices_price");
    expect(patternOf(["gallery", 1])).toBe("gallery_item");
    expect(patternOf([0, "mode"])).toBe("mode");
    expect(patternOf([])).toBe("");
  });

  it("round-trips API paths", () => {
    expect(pathFromDotted("prices.2.price")).toEqual(["prices", 2, "price"]);
    expect(dottedOf(["prices", 2, "price"])).toBe("prices.2.price");
  });

  it("finds every concrete path of a pattern", () => {
    const value = { prices: [{ price: 1 }, { price: 2 }], gallery: [{ src: "a" }, { src: "b" }] };
    expect(pathsMatching(value, "prices_price")).toEqual([
      ["prices", 0, "price"],
      ["prices", 1, "price"],
    ]);
    expect(pathsMatching(value, "gallery_item")).toEqual([
      ["gallery", 0],
      ["gallery", 1],
    ]);
    expect(pathsMatching({ title: "x" }, "id")).toEqual([["id"]]);
    expect(pathsMatching({}, "prices_price")).toEqual([]);
  });
});

describe("slugs and ids", () => {
  it("makes web addresses from titles", () => {
    expect(slugify("Bali 5 Days & 4 Nights")).toBe("bali-5-days-and-4-nights");
    expect(slugify("  Cox’s Bazar — Sea View!  ")).toBe("coxs-bazar-sea-view");
    expect(slugify("Cox's Bazar")).toBe("coxs-bazar");
    expect(slugify("Ça va")).toBe("ca-va");
  });

  it("keeps generated ids free", () => {
    expect(freeId("Visa help", new Set())).toBe("visa-help");
    const taken = freeId("Visa help", new Set(["visa-help"]), "item", () => 0);
    expect(taken).toBe("visa-help-aaaa");
    expect(freeId("", new Set())).toBe("item");
  });

  it("makes camelCase keys", () => {
    expect(camelKey("Page yield")).toBe("pageYield");
    expect(camelKey("Colour")).toBe("colour");
    expect(camelKey("2 in 1")).toBe("k2In1");
  });
});

describe("automatic fields", () => {
  it("dates use Asia/Dhaka", () => {
    expect(todayInDhaka(NOW)).toBe("2026-10-20");
    expect(nowInDhaka(NOW)).toBe("2026-10-20T00:30:00+06:00");
  });

  it("fills ids, dates, day numbers and reading time on a new tour package", () => {
    const schema = editorSchema("tourPackages");
    const blueprint = buildResolvedBlueprint("tourPackages", schema, words);
    const value = {
      title: "Bangkok and Pattaya",
      itinerary: [
        { day: 7, title: "Arrive", body: "Hotel check-in" },
        { day: 1, title: "City tour", body: "Temples" },
      ],
      summary: Array.from({ length: 450 }, () => "word").join(" "),
    };
    const next = applyAutomatic(value, blueprint, { isNew: true, now: NOW }) as Record<
      string,
      unknown
    >;
    expect(next.id).toBe("bangkok-and-pattaya");
    expect(next.publishedAt).toBe("2026-10-20");
    expect((next.itinerary as Array<{ day: number }>).map((day) => day.day)).toEqual([1, 2]);
    expect(next.readingMinutes).toBeUndefined();
    // Saving an existing record keeps its id and its first published date.
    const again = applyAutomatic({ ...next, id: "kept", publishedAt: "2026-01-01" }, blueprint, {
      isNew: false,
      now: NOW,
    }) as Record<string, unknown>;
    expect(again.id).toBe("kept");
    expect(again.publishedAt).toBe("2026-01-01");
  });

  it("gives list items ids and keys, and works out reading time and levels", () => {
    const post = buildResolvedBlueprint("blogPosts", editorSchema("blogPosts"), words);
    const filled = applyAutomatic(
      {
        title: "Visa tips",
        sections: [
          { heading: "Before you apply", body: `<p>${"word ".repeat(400)}</p>` },
          { id: "kept", heading: "x" },
        ],
      },
      post,
      { isNew: true, now: NOW },
    ) as { sections: Array<{ id: string }>; readingMinutes: number };
    expect(filled.sections.map((section) => section.id)).toEqual(["before-you-apply", "kept"]);
    expect(filled.readingMinutes).toBe(2);

    const sets = buildResolvedBlueprint("attributeSets", editorSchema("attributeSets"), words);
    const keyed = applyAutomatic(
      {
        name: "Toner",
        attributes: [
          { label: "Page yield" },
          { label: "Page yield" },
          { key: "colour", label: "Colour" },
        ],
      },
      sets,
      { isNew: true, now: NOW },
    ) as { attributes: Array<{ key: string }> };
    expect(keyed.attributes.map((item) => item.key)).toEqual(["pageYield", "pageYield2", "colour"]);

    const categories = buildResolvedBlueprint("categories", editorSchema("categories"), words);
    const child = applyAutomatic({ name: "Toner", parentId: "printing" }, categories, {
      isNew: true,
      now: NOW,
      levelOf: (id) => (id === "printing" ? 0 : undefined),
    }) as { level: number };
    expect(child.level).toBe(1);
    const top = applyAutomatic({ name: "Printing", parentId: null }, categories, {
      isNew: true,
      now: NOW,
    }) as { level: number };
    expect(top.level).toBe(0);
  });

  it("stamps 'Last updated' on every save", () => {
    const pages = buildResolvedBlueprint("pages", editorSchema("pages"), words);
    const saved = applyAutomatic({ title: "Terms", lastUpdated: "2025-01-01" }, pages, {
      isNew: false,
      now: NOW,
    }) as { lastUpdated: string };
    expect(saved.lastUpdated).toBe("2026-10-20");
  });
});

describe("validation", () => {
  it("says what is wrong in plain codes", () => {
    expect(checkValue({ type: "string", minLength: 1 }, "", true)).toEqual({ code: "required" });
    expect(checkValue({ type: "string", maxLength: 5 }, "toolong", true)).toEqual({
      code: "tooLong",
      values: { max: 5 },
    });
    expect(
      checkValue({ type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }, "Bali Trip", true),
    ).toEqual({
      code: "slug",
    });
    expect(checkValue({ type: "string", pattern: "^\\+[1-9]\\d{6,14}$" }, "01712", true)).toEqual({
      code: "phone",
    });
    expect(checkValue({ type: "string", pattern: "^[A-Z]{3}$" }, "dac", true)).toEqual({
      code: "code",
      values: { example: "DAC" },
    });
    expect(checkValue({ type: "integer", minimum: 0 }, -1, true)).toEqual({
      code: "min",
      values: { min: 0 },
    });
    expect(checkValue({ type: "integer" }, 1.5, true)).toEqual({ code: "integer" });
    expect(checkValue({ type: "string" }, undefined, false)).toBeNull();
  });

  it("checks a whole record but skips what the system fills in", () => {
    const schema = editorSchema("faqs");
    const blueprint = buildResolvedBlueprint("faqs", schema, words);
    const errors = validateRecord(
      schema,
      { category: "visa", question: "", answer: "Yes", order: 0, sample: false },
      blueprint,
    );
    expect([...errors.keys()]).toEqual(["question"]);
  });
});

describe("history", () => {
  const schema = editorSchema("tourPackages");
  const blueprint = buildResolvedBlueprint("tourPackages", schema, words);

  it("lists changes in form order, with lists as counts and long text as edited", () => {
    const before = {
      title: "Bali",
      fromPrice: 64900,
      summary: "Old",
      prices: [{ sharing: "twin", label: "Twin", detail: "x", price: 64900 }],
      inclusions: ["Hotel"],
      popularity: 3,
    };
    const after = {
      title: "Bali",
      fromPrice: 59900,
      summary: "New",
      prices: [
        { sharing: "twin", label: "Twin", detail: "x", price: 59900 },
        { sharing: "single", label: "Single", detail: "y", price: 80000 },
      ],
      inclusions: ["Hotel", "Breakfast"],
      popularity: 9,
    };
    const changes = changesBetween(before, after, blueprint);
    expect(changes.map((change) => `${change.kind}:${change.pattern}`)).toEqual([
      "edited:summary",
      "changed:fromPrice",
      "list:prices",
      "changed:inclusions",
    ]);
  });

  it("looks inside list items when the count stays", () => {
    const changes = changesBetween(
      { prices: [{ price: 1 }] },
      { prices: [{ price: 2 }] },
      blueprint,
    );
    expect(changes).toEqual([
      { kind: "changed", pattern: "prices_price", path: ["prices", 0, "price"], from: 1, to: 2 },
    ]);
  });
});

describe("problems", () => {
  it("turns API problems into plain outcomes", () => {
    expect(viewOfProblem({ status: 401 })).toEqual({ kind: "signedOut" });
    expect(viewOfProblem({ status: 403 })).toEqual({ kind: "message", code: "forbidden" });
    expect(viewOfProblem({ status: 409, code: "exists" })).toEqual({
      kind: "message",
      code: "exists",
    });
    const current = { version: 4, updatedBy: "Rafi", updatedAt: "2026-10-19T10:00:00.000Z" };
    expect(viewOfProblem({ status: 409, code: "stale", current })).toEqual({
      kind: "stale",
      current,
    });
    expect(viewOfProblem({ status: 0 })).toEqual({ kind: "message", code: "offline" });
    expect(viewOfProblem({ status: 500 })).toEqual({ kind: "message", code: "server" });
    const view = viewOfProblem(
      {
        status: 422,
        fields: [
          { path: "title", message: "Too small" },
          { path: "slug", message: "Invalid" },
        ],
      },
      new Map([["title", { code: "required" as const }]]),
    );
    expect(view.kind === "fields" && [...view.errors.entries()]).toEqual([
      ["title", { code: "required" }],
      ["slug", { code: "invalid" }],
    ]);
  });
});
