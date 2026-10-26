import type { TourPackage } from "@waafa/shared";
import type { PackageQueryInput } from "./packageLeadForm";

/** Package query defaults and the price estimate, without zod (issue 236). */

/** The departure value for "any date" on packages without fixed departures. */
export const ANY_DATE = "any";

export function packageQueryDefaults(
  pkg: Pick<TourPackage, "departures" | "anyDate" | "prices">,
): PackageQueryInput {
  const first = pkg.departures[0]?.date;
  return {
    departure: first ?? (pkg.anyDate ? ANY_DATE : ""),
    adults: 2,
    children: 0,
    infants: 0,
    roomSharing: pkg.prices[0]?.sharing ?? "twin",
    preferredContact: "call",
    notes: "",
    consent: false,
  };
}

/**
 * Indicative total for the booking card (PackageDetail "Estimated total"): adults at the chosen room sharing,
 * children at the child-with-bed price and infants at the infant price. Missing child prices fall back to the
 * adult price, a missing infant price to zero.
 */
export function estimatePackageTotal(
  prices: TourPackage["prices"],
  travellers: Pick<PackageQueryInput, "adults" | "children" | "infants" | "roomSharing">,
): number {
  const priceOf = (sharing: string) => prices.find((price) => price.sharing === sharing)?.price;
  const adult = priceOf(travellers.roomSharing) ?? prices[0]?.price ?? 0;
  const child = priceOf("child-with-bed") ?? adult;
  const infant = priceOf("infant") ?? 0;
  return travellers.adults * adult + travellers.children * child + travellers.infants * infant;
}
