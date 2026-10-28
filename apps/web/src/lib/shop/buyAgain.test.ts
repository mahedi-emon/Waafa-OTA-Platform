import { describe, expect, it, vi } from "vitest";

const product = (
  id: string,
  variants: Array<{ id: string; stock: number; price: number }>,
  showPrice = true,
) => ({
  id,
  slug: `${id}-slug`,
  title: `Product ${id}`,
  showPrice,
  images: [{ src: "/a.jpg", alt: "A" }],
  variants: variants.map((variant) => ({ ...variant, sku: `${variant.id}-sku`, images: [] })),
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/shop", () => ({
  listProducts: vi.fn(async () => ({
    items: [
      product("p1", [{ id: "v1", stock: 2, price: 1200 }]),
      product("p2", [{ id: "v2", stock: 0, price: 500 }]),
      product("p3", [{ id: "v3", stock: 9, price: 900 }], false),
    ],
    total: 3,
  })),
}));

const item = (productId: string, variantId: string, quantity: number) => ({
  productId,
  variantId,
  title: "old title",
  sku: "old",
  quantity,
});

describe("buyAgainLines (issue 246)", () => {
  it("uses today's price and stock and leaves out what cannot be bought", async () => {
    const { buyAgainLines } = await import("./buyAgain");
    const lines = await buyAgainLines([
      {
        reference: "WS-1",
        items: [
          item("p1", "v1", 5),
          item("p2", "v2", 1),
          item("p3", "v3", 1),
          item("gone", "x", 1),
        ],
      },
      { reference: "WS-2", items: [item("p2", "v2", 1)] },
    ]);
    expect(lines.get("WS-1")).toEqual([
      expect.objectContaining({ variantId: "v1", price: 1200, qty: 2, maxQty: 2, slug: "p1-slug" }),
    ]);
    expect(lines.has("WS-2")).toBe(false);
  });
});
