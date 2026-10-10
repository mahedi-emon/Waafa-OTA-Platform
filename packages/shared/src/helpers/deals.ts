import type { Deal, Product } from "../schemas/shop";

/**
 * Applies running deals (FR-SHOP-01 "deals with an end date") to products: the deal variant sells at the deal price,
 * its MRP becomes the higher of the old MRP and the normal price, and the product gets the "deal" badge. Cards,
 * product pages and the cart all read the same effective price. `deals` are the ones that have not ended.
 */
export function withDeals<T extends Product>(
  product: T,
  deals: readonly Pick<Deal, "productId" | "variantId" | "dealPrice">[],
): T {
  const mine = deals.filter((deal) => deal.productId === product.id);
  if (mine.length === 0) return product;
  return {
    ...product,
    badges: product.badges.includes("deal") ? product.badges : ["deal", ...product.badges],
    variants: product.variants.map((variant) => {
      const deal = mine.find((item) => item.variantId === variant.id);
      if (!deal || deal.dealPrice >= variant.price) return variant;
      return { ...variant, price: deal.dealPrice, mrp: Math.max(variant.mrp ?? 0, variant.price) };
    }),
  };
}

/** A schedule (banner, coupon, deal window) that includes `now`: started, and not yet ended. */
export function isScheduledNow(
  schedule: { startsAt: string; endsAt?: string },
  now: Date,
): boolean {
  const time = now.getTime();
  if (Date.parse(schedule.startsAt) > time) return false;
  return schedule.endsAt === undefined || Date.parse(schedule.endsAt) > time;
}
