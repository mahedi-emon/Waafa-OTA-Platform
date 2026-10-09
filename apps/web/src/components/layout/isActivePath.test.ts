import { describe, expect, it } from "vitest";
import { isActivePath } from "./isActivePath";

describe("isActivePath", () => {
  it("marks Home only on the home page", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/tour-packages", "/")).toBe(false);
  });

  it("keeps a section active on its children", () => {
    expect(isActivePath("/shop", "/shop")).toBe(true);
    expect(isActivePath("/shop/c/printers-and-supplies", "/shop")).toBe(true);
    expect(isActivePath("/shopping", "/shop")).toBe(false);
  });

  it("ignores query strings and missing links", () => {
    expect(isActivePath("/tour-packages", "/tour-packages?q=bali")).toBe(true);
    expect(isActivePath("/tour-packages", undefined)).toBe(false);
  });
});
