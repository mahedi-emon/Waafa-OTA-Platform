import { describe, expect, it } from "vitest";
import { exitPreviewHref, previewHref } from "../previewLinks";
import { previewPath } from "./preview";

describe("previewPath (D0 R7)", () => {
  it("keeps a page of the site with its query", () => {
    expect(previewPath("/tour-packages/bali-escape")).toBe("/tour-packages/bali-escape");
    expect(previewPath("/shop/c/printers?sort=price")).toBe("/shop/c/printers?sort=price");
    expect(previewPath("/bn/visa/thailand")).toBe("/bn/visa/thailand");
    expect(previewPath("/blog/../visa")).toBe("/visa");
  });

  it("never leaves the site or opens the admin or an API route", () => {
    for (const value of [
      "https://evil.example/",
      "//evil.example/",
      "/\\evil.example",
      "javascript:alert(1)",
      "tour-packages",
      "/secure-admin-control",
      "/en/secure-admin-control/content",
      "/api/preview/exit",
      "/api",
      `/${"a".repeat(600)}`,
      "/x\ny",
      null,
      42,
    ]) {
      expect(previewPath(value)).toBe("/");
    }
  });

  it("checks the path again after dot segments collapse (no //other.site)", () => {
    for (const value of [
      "/.//evil.example",
      "/..//evil.example",
      "/%2e//evil.example",
      "/a/..//evil.example",
      "/blog/../secure-admin-control",
    ]) {
      expect(previewPath(value)).toBe("/");
    }
  });

  it("builds the on and off addresses", () => {
    expect(previewHref("/blog/a b")).toBe("/secure-admin-control/preview?path=%2Fblog%2Fa%20b");
    expect(exitPreviewHref("/")).toBe("/api/preview/exit?path=%2F");
  });
});
