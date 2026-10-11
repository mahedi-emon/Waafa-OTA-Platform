import { CABIN_CLASSES } from "@waafa/shared/constants";

/*
 * The flight search card's option lists, without zod or nuqs (#39): the pickers import these, the URL parsers in
 * flightParams.ts build on the same arrays.
 */
export const TRIP_TYPES = ["one-way", "round-trip", "multi-city"] as const;
export { CABIN_CLASSES };
export const FARE_TYPES = ["regular", "student"] as const;

export type TripType = (typeof TRIP_TYPES)[number];
export type CabinClass = (typeof CABIN_CLASSES)[number];
export type FareType = (typeof FARE_TYPES)[number];
