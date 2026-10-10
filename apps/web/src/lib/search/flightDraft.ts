import type { Airport, FlightSearch, HotelPlace, HotelSearch } from "@waafa/shared";
import { initialSearchState, type FlightDraft, type HotelDraft } from "./searchState";

/**
 * The search card's flight draft for a search read from the URL (results pages): airports come from the data layer
 * by IATA code; unknown codes stay empty so the visitor picks them again.
 */
export function flightDraftFromSearch(
  search: FlightSearch,
  airports: Map<string, Airport>,
): FlightDraft {
  const base = initialSearchState({ origin: null }).flight;
  const airport = (code: string) => airports.get(code) ?? null;
  const first = search.legs[0];
  const multi = search.tripType === "multi-city";
  return {
    ...base,
    trip: search.tripType,
    from: multi || !first ? null : airport(first.from),
    to: multi || !first ? null : airport(first.to),
    depart: multi ? null : (first?.date ?? null),
    return: search.tripType === "round-trip" ? (search.returnDate ?? null) : null,
    legs: multi
      ? search.legs.map((leg) => ({ from: airport(leg.from), to: airport(leg.to), date: leg.date }))
      : [],
    adults: search.travellers.adults,
    childAges: [...search.travellers.childAges],
    infants: search.travellers.infants,
    cabin: search.cabin,
    direct: search.directOnly,
    flex: search.flexibleDates,
    fare: search.fareType,
    airline: search.preferredAirline ?? null,
  };
}

/** The hotel tab's draft for a hotel search read from the URL; the place comes from the data layer when known. */
export function hotelDraftFromSearch(search: HotelSearch, place: HotelPlace | null): HotelDraft {
  return {
    place: place ?? {
      id: search.placeId,
      kind: "city",
      name: search.placeLabel,
      city: search.placeLabel,
      country: "",
      popular: false,
    },
    checkin: search.checkIn,
    checkout: search.checkOut,
    rooms: search.rooms.length,
    adults: search.rooms.reduce((sum, room) => sum + room.adults, 0),
    childAges: search.rooms.flatMap((room) => room.childAges),
    nationality: search.nationality,
  };
}
