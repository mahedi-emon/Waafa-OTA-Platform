import { describe, expect, it } from "vitest";
import {
  addLine,
  cartCount,
  cartSubtotal,
  parseLines,
  removeLine,
  setLineQty,
  type CartLine,
} from "./cart";

const line = (variantId: string, qty: number, maxQty = 10, price = 1450): CartLine => ({
  productId: "p1",
  variantId,
  slug: "toner",
  title: "Toner",
  variantLabel: "",
  sku: variantId.toUpperCase(),
  price,
  qty,
  maxQty,
});

describe("cart lines", () => {
  it("adds, merges and clamps to stock", () => {
    let lines = addLine([], line("a", 2));
    lines = addLine(lines, line("a", 9));
    expect(lines).toHaveLength(1);
    expect(lines[0]?.qty).toBe(10);
    lines = addLine(lines, line("b", 1, 5, 450));
    expect(cartCount(lines)).toBe(11);
    expect(cartSubtotal(lines)).toBe(10 * 1450 + 450);
  });

  it("sets quantity, removes at zero and removes a line", () => {
    const lines = [line("a", 2), line("b", 1)];
    expect(setLineQty(lines, "a", 4)[0]?.qty).toBe(4);
    expect(setLineQty(lines, "a", 0).map((item) => item.variantId)).toEqual(["b"]);
    expect(setLineQty(lines, "a", 50)[0]?.qty).toBe(10);
    expect(removeLine(lines, "b").map((item) => item.variantId)).toEqual(["a"]);
  });

  it("drops malformed stored data", () => {
    expect(parseLines(null)).toEqual([]);
    expect(parseLines("not json")).toEqual([]);
    expect(parseLines(JSON.stringify([line("a", 1), { variantId: 3 }, null]))).toHaveLength(1);
  });
});
