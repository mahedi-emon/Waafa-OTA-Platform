import type { VisaTypeDetail } from "../schemas/visa";

/** A visa price per applicant: a range, or a starting price when there is no top (issue 179). */
export type VisaPrice = { min: number; max?: number };

/**
 * What the site shows for a visa type: the admin's price range, else "from" the embassy fee plus the service charge
 * (the embassy fee counts as 0 while it is confirmed later). Never a single fixed price.
 */
export function visaPrice(
  type: Pick<VisaTypeDetail, "priceRange" | "embassyFee" | "serviceCharge">,
): VisaPrice {
  if (type.priceRange) {
    const { min, max } = type.priceRange;
    return max !== undefined && max > min ? { min, max } : { min };
  }
  return { min: (type.embassyFee ?? 0) + type.serviceCharge };
}

/** The lowest price across a country's visa types, for cards: "From ৳7,500". */
export function lowestVisaPrice(
  types: ReadonlyArray<Pick<VisaTypeDetail, "priceRange" | "embassyFee" | "serviceCharge">>,
): number {
  return Math.min(...types.map((type) => visaPrice(type).min));
}

/** The price for a group: both ends times the number of applicants. */
export function visaPriceFor(price: VisaPrice, applicants: number): VisaPrice {
  const count = Math.max(1, Math.floor(applicants));
  return price.max === undefined
    ? { min: price.min * count }
    : { min: price.min * count, max: price.max * count };
}
