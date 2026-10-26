import type { PlanTripInput } from "./planTripLeadForm";

/** Plan my trip choices, without zod (issue 236). */

export const BUDGET_BANDS = [
  "any",
  "under-30000",
  "30000-60000",
  "60000-100000",
  "over-100000",
] as const;

export const INTERESTS = [
  "beach",
  "mountains",
  "city",
  "food",
  "shopping",
  "culture",
  "adventure",
  "relaxed",
] as const;

export const TRIP_FOR = ["family", "couple", "friends", "solo", "office"] as const;

export const HOTEL_CLASSES = ["3", "4", "5", "resort", "any"] as const;

export function planTripDefaults(place?: string): PlanTripInput {
  return {
    places: place ? [place] : [],
    notSure: false,
    dateMode: "month",
    startDate: "",
    endDate: "",
    month: "",
    nights: 5,
    adults: 2,
    children: 0,
    infants: 0,
    budgetBand: "any",
    hotelClass: "any",
    tripFor: "",
    interests: [],
    includeFlights: true,
    visaHelp: false,
    preferredContact: "whatsapp",
    notes: "",
    consent: false,
  };
}
