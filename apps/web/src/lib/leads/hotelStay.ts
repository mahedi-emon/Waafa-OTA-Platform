import type { HotelSearch } from "@waafa/shared";
import type { StayStepInput } from "./hotelLeadForm";

/*
 * The hotel request's step 2 defaults, kept apart from the zod schema in hotelLeadForm.ts so the page can fill the
 * form without loading validation first (issue 170).
 */

/** A curated hotel's Request booking (FR-HTL-02): the hotel and the room type the customer chose. */
export type ChosenHotel = { id: string; name: string; city: string; roomType?: string };

/** "Sample Beach Resort, Cox’s Bazar": the place a curated hotel's request starts with. */
export const chosenHotelPlace = (hotel: ChosenHotel) => `${hotel.name}, ${hotel.city}`;

export function stayDefaults(
  search: HotelSearch | null,
  hotel?: ChosenHotel | null,
): StayStepInput {
  return {
    place: hotel ? chosenHotelPlace(hotel) : (search?.placeLabel ?? ""),
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
