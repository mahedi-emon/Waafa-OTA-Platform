import type { HotelSearch } from "@waafa/shared";
import type { StayStepInput } from "./hotelLeadForm";

/*
 * The hotel request's step 2 defaults, kept apart from the zod schema in hotelLeadForm.ts so the page can fill the
 * form without loading validation first (issue 170).
 */

export function stayDefaults(search: HotelSearch | null): StayStepInput {
  return {
    place: search?.placeLabel ?? "",
    nationality: search?.nationality ?? "BD",
    checkin: search?.checkIn ?? "",
    checkout: search?.checkOut ?? "",
    budgetBand: "any",
    meals: "any",
    stars: "any",
    guests: {
      rooms: search?.rooms.length ?? 1,
      adults: search ? search.rooms.reduce((sum, room) => sum + room.adults, 0) : 2,
      childAges: search ? search.rooms.flatMap((room) => room.childAges) : [],
    },
    preferredContact: "call",
    bestTime: "any",
    notes: "",
    consent: false,
  };
}
