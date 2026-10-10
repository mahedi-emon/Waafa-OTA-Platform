import type { Product, ProductOption, Variant } from "@waafa/shared";

/*
 * Variant maths for Waafas World (FR-CAT-03, FR-SHOP-03/04): which variant a set of choices points at, which values
 * can still be chosen, the price against MRP and the stock badge. Prices are VAT-inclusive taka.
 */

export type StockBadge = "in-stock" | "low-stock" | "out-of-stock" | "pre-order";
export type Selection = Record<string, string>;

export function defaultVariant(product: Pick<Product, "variants" | "defaultVariantId">): Variant {
  const variant =
    product.variants.find((item) => item.id === product.defaultVariantId) ?? product.variants[0];
  if (!variant) throw new Error("A product needs at least one variant");
  return variant;
}

/** The variant whose options match every chosen value, or null when that combination isn't sold. */
export function resolveVariant(
  product: Pick<Product, "variants" | "options">,
  selection: Selection,
): Variant | null {
  return (
    product.variants.find((variant) =>
      product.options.every((option) => variant.options[option.key] === selection[option.key]),
    ) ?? null
  );
}

/**
 * Picking `value` for `option` while keeping the other choices: the exact variant when it exists, otherwise the first
 * variant with that value (so a colour change never lands on an impossible size).
 */
export function pickOption(
  product: Pick<Product, "variants" | "options">,
  selection: Selection,
  option: string,
  value: string,
): Selection {
  const wanted = { ...selection, [option]: value };
  const exact = resolveVariant(product, wanted);
  if (exact) return { ...exact.options };
  const fallback = product.variants.find((variant) => variant.options[option] === value);
  return fallback ? { ...fallback.options } : wanted;
}

/** Whether `value` of `option` exists in stock (or pre-order) together with the other current choices. */
export function isValueAvailable(
  product: Pick<Product, "variants" | "options">,
  selection: Selection,
  option: ProductOption,
  value: string,
): boolean {
  const variant = resolveVariant(product, { ...selection, [option.key]: value });
  return Boolean(variant && (variant.stock > 0 || variant.preOrder));
}

export function stockBadge(
  variant: Pick<Variant, "stock" | "lowStockAt" | "preOrder">,
): StockBadge {
  if (variant.stock <= 0) return variant.preOrder ? "pre-order" : "out-of-stock";
  return variant.stock <= variant.lowStockAt ? "low-stock" : "in-stock";
}

export function canBuy(variant: Pick<Variant, "stock" | "preOrder">): boolean {
  return variant.stock > 0 || variant.preOrder;
}

/** Price against MRP: the saving and the whole-number percent off, only when the MRP is higher. */
export function priceInfo(variant: Pick<Variant, "price" | "mrp">): {
  price: number;
  mrp?: number;
  save: number;
  percentOff: number;
} {
  const { price, mrp } = variant;
  if (!mrp || mrp <= price) return { price, save: 0, percentOff: 0 };
  return { price, mrp, save: mrp - price, percentOff: Math.round(((mrp - price) / mrp) * 100) };
}

/** Lowest and highest variant price, for cards of products with options ("From ৳450"). */
export function priceRange(product: Pick<Product, "variants">): { min: number; max: number } {
  const prices = product.variants.map((variant) => variant.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Images for a variant: its own first, then the product's. */
export function variantImages(product: Pick<Product, "images">, variant: Pick<Variant, "images">) {
  const seen = new Set<string>();
  return [...variant.images, ...product.images].filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}
