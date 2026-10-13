import { describe, expect, it } from "vitest";
import type { Product } from "@waafa/shared";
import { publicProduct } from "./publicProduct";

const product = (showPrice: boolean) =>
  ({
    id: "p1",
    showPrice,
    variants: [
      { id: "v1", sku: "A", price: 1450, mrp: 1800 },
      { id: "v2", sku: "B", price: 1600 },
    ],
  }) as unknown as Product;

describe("publicProduct (issue 178)", () => {
  it("keeps the prices of a product whose price is shown", () => {
    const shown = product(true);
    expect(publicProduct(shown)).toBe(shown);
  });

  it("blanks every variant price and MRP when the price is hidden", () => {
    const hidden = publicProduct(product(false));
    expect(hidden.variants.map((variant) => variant.price)).toEqual([0, 0]);
    expect(hidden.variants.every((variant) => variant.mrp === undefined)).toBe(true);
    expect(JSON.stringify(hidden)).not.toMatch(/1450|1800|1600/);
  });
});
