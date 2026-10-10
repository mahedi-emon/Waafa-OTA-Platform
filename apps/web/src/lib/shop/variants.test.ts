import type { Product, Variant } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import {
  defaultVariant,
  isValueAvailable,
  pickOption,
  priceInfo,
  priceRange,
  resolveVariant,
  stockBadge,
  variantImages,
} from "./variants";

const variant = (
  id: string,
  colour: string,
  size: string,
  stock: number,
  price = 450,
): Variant => ({
  id,
  sku: id.toUpperCase(),
  options: { colour, size },
  price,
  stock,
  lowStockAt: 3,
  preOrder: false,
  images: [],
});

const tee = {
  options: [
    {
      key: "colour",
      label: "Colour",
      display: "swatch",
      values: [{ value: "White" }, { value: "Navy" }],
    },
    { key: "size", label: "Size", display: "size", values: [{ value: "M" }, { value: "L" }] },
  ],
  variants: [
    variant("wht-m", "White", "M", 8),
    variant("wht-l", "White", "L", 0),
    variant("nvy-l", "Navy", "L", 2, 490),
  ],
  defaultVariantId: "wht-m",
  images: [{ src: "/p.jpg", alt: "Tee" }],
} as unknown as Product;

describe("variant resolution", () => {
  it("finds the default and the exact variant", () => {
    expect(defaultVariant(tee).id).toBe("wht-m");
    expect(resolveVariant(tee, { colour: "Navy", size: "L" })?.sku).toBe("NVY-L");
    expect(resolveVariant(tee, { colour: "Navy", size: "M" })).toBeNull();
  });

  it("moves to a sold combination when a choice has no exact match", () => {
    expect(pickOption(tee, { colour: "White", size: "M" }, "colour", "Navy")).toEqual({
      colour: "Navy",
      size: "L",
    });
    expect(pickOption(tee, { colour: "White", size: "M" }, "size", "L")).toEqual({
      colour: "White",
      size: "L",
    });
  });

  it("marks values out of stock with the current choices", () => {
    const size = tee.options[1]!;
    expect(isValueAvailable(tee, { colour: "White", size: "M" }, size, "L")).toBe(false);
    expect(isValueAvailable(tee, { colour: "Navy", size: "L" }, size, "L")).toBe(true);
  });
});

describe("price and stock", () => {
  it("computes saving and percent off only when MRP is higher", () => {
    expect(priceInfo({ price: 1450, mrp: 1800 })).toEqual({
      price: 1450,
      mrp: 1800,
      save: 350,
      percentOff: 19,
    });
    expect(priceInfo({ price: 1450, mrp: 1450 })).toEqual({ price: 1450, save: 0, percentOff: 0 });
    expect(priceInfo({ price: 999 })).toEqual({ price: 999, save: 0, percentOff: 0 });
  });

  it("gives the price range and stock badges", () => {
    expect(priceRange(tee)).toEqual({ min: 450, max: 490 });
    expect(stockBadge({ stock: 8, lowStockAt: 3, preOrder: false })).toBe("in-stock");
    expect(stockBadge({ stock: 2, lowStockAt: 3, preOrder: false })).toBe("low-stock");
    expect(stockBadge({ stock: 0, lowStockAt: 3, preOrder: false })).toBe("out-of-stock");
    expect(stockBadge({ stock: 0, lowStockAt: 3, preOrder: true })).toBe("pre-order");
  });

  it("puts variant images first without duplicates", () => {
    const images = variantImages(tee, {
      images: [
        { src: "/navy.jpg", alt: "Navy" },
        { src: "/p.jpg", alt: "Tee" },
      ],
    } as Variant);
    expect(images.map((image) => image.src)).toEqual(["/navy.jpg", "/p.jpg"]);
  });
});
