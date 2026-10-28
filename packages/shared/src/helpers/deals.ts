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

/** A deal or flash sale whose price applies now: started (or no start) and not ended (issue 247). */
export function dealIsLive(deal: Pick<Deal, "startsAt" | "endsAt">, now: Date): boolean {
  const time = now.getTime();
  if (deal.startsAt && Date.parse(deal.startsAt) > time) return false;
  return Date.parse(deal.endsAt) > time;
}

/**
 * Flash-sale caps (issue 247): a deal with a stock cap applies to a line only while the units already sold at its
 * price plus the line's quantity stay within the cap. `sold` maps deal id → units sold at the deal price.
 */
export function dealsWithinCap<T extends Pick<Deal, "id" | "variantId" | "stockCap">>(
  deals: readonly T[],
  sold: ReadonlyMap<string, number>,
  lines: ReadonlyArray<{ variantId: string; quantity: number }>,
): T[] {
  return deals.filter((deal) => {
    if (deal.stockCap === undefined) return true;
    const wanted = lines
      .filter((line) => line.variantId === deal.variantId)
      .reduce((sum, line) => sum + line.quantity, 0);
    return (sold.get(deal.id) ?? 0) + Math.max(wanted, 1) <= deal.stockCap;
  });
}
