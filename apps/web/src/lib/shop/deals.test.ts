import type { Product } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import { withDeals } from "./deals";

const product = {
  id: "p1",
  badges: ["new"],
  variants: [
    {
      id: "v1",
      sku: "V1",
      options: {},
      price: 2450,
      stock: 5,
      lowStockAt: 3,
      preOrder: false,
      images: [],
    },
    {
      id: "v2",
      sku: "V2",
      options: {},
      price: 1690,
      mrp: 1990,
      stock: 5,
      lowStockAt: 3,
      preOrder: false,
      images: [],
    },
  ],
} as unknown as Product;

describe("deals", () => {
  it("sells the deal variant at the deal price with the normal price as MRP", () => {
    const result = withDeals(product, [{ productId: "p1", variantId: "v1", dealPrice: 2290 }]);
    expect(result.variants[0]).toMatchObject({ price: 2290, mrp: 2450 });
    expect(result.variants[1]).toMatchObject({ price: 1690, mrp: 1990 });
    expect(result.badges).toEqual(["deal", "new"]);
  });

  it("ignores other products and deals that would raise the price", () => {
    expect(withDeals(product, [{ productId: "p2", variantId: "v1", dealPrice: 100 }])).toBe(
      product,
    );
    expect(
      withDeals(product, [{ productId: "p1", variantId: "v2", dealPrice: 1800 }]).variants[1]
        ?.price,
    ).toBe(1690);
  });
});
