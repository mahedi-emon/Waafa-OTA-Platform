import { CabinClassSchema, FlightSearchSchema, type FlightSearch } from "@waafa/shared";
import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral,
  type inferParserType,
} from "nuqs/server";
import { parseAsAirlineCode, parseAsIata, parseAsIsoDateString, parseAsLeg } from "./parsers";

/*
 * Flight search in the URL (FR-SRCH-09): the search card writes it, /flights reads it, and the back button and
 * shared links restore the same trip. Defaults stay out of the URL, so a one-way economy search for one adult
 * reads /flights?from=DAC&to=DXB&depart=2026-10-22.
 */

export const TRIP_TYPES = ["one-way", "round-trip", "multi-city"] as const;
export const CABIN_CLASSES = CabinClassSchema.options;
export const FARE_TYPES = ["regular", "student"] as const;

export type TripType = (typeof TRIP_TYPES)[number];
export type CabinClass = (typeof CABIN_CLASSES)[number];
export type FareType = (typeof FARE_TYPES)[number];

export const flightSearchParams = {
  trip: parseAsStringLiteral(TRIP_TYPES).withDefault("one-way"),
  from: parseAsIata,
  to: parseAsIata,
  depart: parseAsIsoDateString,
  return: parseAsIsoDateString,
  legs: parseAsArrayOf(parseAsLeg, ","),
  adults: parseAsInteger.withDefault(1),
  /** One age per child, e.g. children=5,9. */
  children: parseAsArrayOf(parseAsInteger, ",").withDefault([]),
  infants: parseAsInteger.withDefault(0),
  cabin: parseAsStringLiteral(CABIN_CLASSES).withDefault("economy"),
  direct: parseAsBoolean.withDefault(false),
  flex: parseAsBoolean.withDefault(false),
  fare: parseAsStringLiteral(FARE_TYPES).withDefault("regular"),
  airline: parseAsAirlineCode,
};

export type FlightSearchValues = inferParserType<typeof flightSearchParams>;

export const serializeFlightSearch = createSerializer(flightSearchParams);
export const loadFlightSearch = createLoader(flightSearchParams);

/** Turns URL values into a candidate for the shared schema, which does all the validation. */
export function flightValuesToCandidate(values: FlightSearchValues): unknown {
  const legs =
    values.trip === "multi-city"
      ? (values.legs ?? [])
      : [{ from: values.from ?? "", to: values.to ?? "", date: values.depart ?? "" }];
  return {
    tripType: values.trip,
    legs,
    ...(values.trip === "round-trip" && values.return ? { returnDate: values.return } : {}),
    travellers: { adults: values.adults, childAges: values.children, infants: values.infants },
    cabin: values.cabin,
    ...(values.airline ? { preferredAirline: values.airline } : {}),
    directOnly: values.direct,
    flexibleDates: values.flex,
    fareType: values.fare,
  };
}

export function parseFlightValues(values: FlightSearchValues) {
  return FlightSearchSchema.safeParse(flightValuesToCandidate(values));
}

export function flightSearchToValues(search: FlightSearch): FlightSearchValues {
  const multi = search.tripType === "multi-city";
  const first = search.legs[0];
  return {
    trip: search.tripType,
    from: multi ? null : (first?.from ?? null),
    to: multi ? null : (first?.to ?? null),
    depart: multi ? null : (first?.date ?? null),
    return: search.tripType === "round-trip" ? (search.returnDate ?? null) : null,
    legs: multi ? search.legs : null,
    adults: search.travellers.adults,
    children: search.travellers.childAges,
    infants: search.travellers.infants,
    cabin: search.cabin,
    direct: search.directOnly,
    flex: search.flexibleDates,
    fare: search.fareType,
    airline: search.preferredAirline ?? null,
  };
}

/** "/flights?from=DAC&to=DXB&depart=2026-10-22" for a validated search. */
export function flightSearchHref(search: FlightSearch): string {
  return serializeFlightSearch("/flights", flightSearchToValues(search));
}
