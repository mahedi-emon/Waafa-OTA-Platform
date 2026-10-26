/*
 * Option lists and limits without zod (#39). Client components import them from "@waafa/shared/constants" so the
 * first load never pulls the schema modules; the schemas build their enums from the same arrays.
 */

export const MAX_TRAVELLERS = 9;
export const MAX_MULTI_CITY_LEGS = 5;
export const MAX_HOTEL_NIGHTS = 30;
export const MAX_HOTEL_ROOMS = 5;

export const CABIN_CLASSES = ["economy", "premium-economy", "business", "first"] as const;
/** Feedback form services (FR-FDB). */
export const FEEDBACK_SERVICES = [
  "flights",
  "hotels",
  "packages",
  "visa",
  "shop",
  "printing",
  "other",
] as const;
/** Hotel request budget bands and meals (Hotels-2). */
export const HOTEL_BUDGET_BANDS = [
  "any",
  "under-5000",
  "5000-10000",
  "10000-20000",
  "over-20000",
] as const;
export const HOTEL_MEALS = ["any", "room-only", "breakfast", "half-board"] as const;
export const VISA_TYPE_KEYS = ["tourist", "business", "student", "medical", "transit"] as const;
export const VISA_REGIONS = [
  "south-asia",
  "south-east-asia",
  "middle-east",
  "east-asia",
  "europe",
  "americas",
  "oceania",
  "africa",
] as const;

/** Days between two ISO dates (b - a), in whole days. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
