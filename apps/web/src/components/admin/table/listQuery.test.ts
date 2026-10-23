import { describe, expect, it } from "vitest";
import { nextSort, pageRange, pageSizeOf, parseSort, sortOf, withQuery } from "./listQuery";

describe("list URL state (D0 R5)", () => {
  it("reads and cycles a sort", () => {
    expect(parseSort("title.asc")).toEqual({ key: "title", dir: "asc" });
    expect(parseSort("title")).toBeNull();
    expect(parseSort("x.y; drop")).toBeNull();
    expect(nextSort(null, "title")).toEqual({ key: "title", dir: "asc" });
    expect(nextSort({ key: "title", dir: "asc" }, "title")).toEqual({ key: "title", dir: "desc" });
    expect(nextSort({ key: "title", dir: "desc" }, "title")).toBeNull();
    expect(nextSort({ key: "title", dir: "desc" }, "updated")).toEqual({
      key: "updated",
      dir: "asc",
    });
  });

  it("changes the address and goes back to page 1 unless the page itself changes", () => {
    const current = new URLSearchParams("q=bali&page=3&status=live");
    expect(withQuery("/list", current, { status: "draft" })).toBe("/list?q=bali&status=draft");
    expect(withQuery("/list", current, { q: null, status: null })).toBe("/list");
    expect(withQuery("/list", current, { page: "4" })).toBe("/list?q=bali&page=4&status=live");
  });

  it("counts the rows a page shows", () => {
    expect(pageRange(1, 25, 312)).toEqual({ from: 1, to: 25, pages: 13 });
    expect(pageRange(13, 25, 312)).toEqual({ from: 301, to: 312, pages: 13 });
    expect(pageRange(1, 25, 0)).toEqual({ from: 0, to: 0, pages: 1 });
  });

  it("keeps only the page sizes and sorts the API accepts", () => {
    expect(pageSizeOf("50")).toBe(50);
    expect(pageSizeOf("30")).toBe(25);
    expect(pageSizeOf(undefined)).toBe(25);
    expect(sortOf("title.asc", ["title.asc", "title.desc"] as const)).toBe("title.asc");
    expect(sortOf("price.asc", ["title.asc"] as const)).toBeUndefined();
    expect(sortOf(["title.asc"], ["title.asc"] as const)).toBeUndefined();
  });
});
