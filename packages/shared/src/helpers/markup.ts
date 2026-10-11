import type { Markup } from "../schemas/providers";

/**
 * A provider's markup or commission rule on a net price in taka (#107): a percentage or a fixed amount on top,
 * rounded to whole taka. Prices on the site are shown VAT included; the markup applies before display.
 */
export function applyMarkup(netPrice: number, markup: Markup): number {
  if (!Number.isFinite(netPrice) || netPrice < 0)
    throw new RangeError("The net price must be zero or more");
  switch (markup.type) {
    case "percentage":
      return Math.round(netPrice * (1 + markup.value / 100));
    case "fixed":
      return Math.round(netPrice + markup.value);
    case "none":
      return Math.round(netPrice);
  }
}

/** The markup alone, e.g. for the admin's preview ("৳1,250 on a ৳25,000 fare"). */
export function markupAmount(netPrice: number, markup: Markup): number {
  return applyMarkup(netPrice, markup) - Math.round(netPrice);
}
