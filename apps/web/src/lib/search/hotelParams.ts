import { HotelSearchSchema, type HotelRoom, type HotelSearch } from "@waafa/shared";
import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from "nuqs/server";
import { parseAsCountryCode, parseAsIsoDateString } from "./parsers";

/*
 * Hotel search in the URL. The card asks for rooms and guest totals (the Pick-m-rooms board); the shared
 * schema stores guests per room, so totals are spread across rooms when the search is validated.
 */

export const hotelSearchParams = {
  place: parseAsString,
  placeName: parseAsString,
  checkin: parseAsIsoDateString,
  checkout: parseAsIsoDateString,
  rooms: parseAsInteger.withDefault(1),
  adults: parseAsInteger.withDefault(2),
  /** One age per child, e.g. children=4,7. */
  children: parseAsArrayOf(parseAsInteger, ",").withDefault([]),
  nationality: parseAsCountryCode.withDefault("BD"),
};

export type HotelSearchValues = inferParserType<typeof hotelSearchParams>;

export const serializeHotelSearch = createSerializer(hotelSearchParams);
export const loadHotelSearch = createLoader(hotelSearchParams);

/**
 * Spreads guest totals across rooms: adults as evenly as possible (the first rooms take the remainder),
 * then children one by one, starting with the room that has the fewest guests.
 */
export function distributeGuests(rooms: number, adults: number, childAges: number[]): HotelRoom[] {
  const count = Math.max(1, Math.floor(rooms));
  const result: HotelRoom[] = Array.from({ length: count }, (_, index) => ({
    adults: Math.floor(adults / count) + (index < adults % count ? 1 : 0),
    childAges: [],
  }));
  for (const age of childAges) {
    const target = result.reduce(
      (best, room, index) => {
        const guests = room.adults + room.childAges.length;
        return guests < best.guests ? { index, guests } : best;
      },
      { index: 0, guests: Number.POSITIVE_INFINITY },
    );
    result[target.index]?.childAges.push(age);
  }
  return result;
}

export function hotelValuesToCandidate(values: HotelSearchValues): unknown {
  return {
    placeId: values.place ?? "",
    placeLabel: values.placeName ?? "",
    checkIn: values.checkin ?? "",
    checkOut: values.checkout ?? "",
    rooms: distributeGuests(values.rooms, values.adults, values.children),
    nationality: values.nationality,
  };
}

export function parseHotelValues(values: HotelSearchValues) {
  return HotelSearchSchema.safeParse(hotelValuesToCandidate(values));
}

export function hotelSearchToValues(search: HotelSearch): HotelSearchValues {
  return {
    place: search.placeId,
    placeName: search.placeLabel,
    checkin: search.checkIn,
    checkout: search.checkOut,
    rooms: search.rooms.length,
    adults: search.rooms.reduce((sum, room) => sum + room.adults, 0),
    children: search.rooms.flatMap((room) => room.childAges),
    nationality: search.nationality,
  };
}

export function hotelSearchHref(search: HotelSearch): string {
  return serializeHotelSearch("/hotels", hotelSearchToValues(search));
}
