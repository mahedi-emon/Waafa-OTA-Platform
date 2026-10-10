import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from "nuqs/server";
import { parseAsSlug, parseAsTravelMonth } from "./parsers";

/* The tour tab opens /tour-packages filtered by destination, month and party size (FR-SRCH-04). */

export const MAX_TOUR_ADULTS = 30;
export const MAX_TOUR_CHILDREN = 10;

export const tourSearchParams = {
  /** A destination slug picked from the list. */
  destination: parseAsSlug,
  /** Free text typed into the picker when no destination matches. */
  search: parseAsString,
  /** "2026-12"; left out when the visitor is flexible. */
  month: parseAsTravelMonth,
  adults: parseAsInteger.withDefault(2),
  children: parseAsInteger.withDefault(0),
};

export type TourSearchValues = inferParserType<typeof tourSearchParams>;

export const serializeTourSearch = createSerializer(tourSearchParams);
export const loadTourSearch = createLoader(tourSearchParams);

export function tourSearchHref(values: Partial<TourSearchValues>): string {
  const search = values.search?.trim() ? values.search.trim().slice(0, 80) : null;
  return serializeTourSearch("/tour-packages", {
    destination: values.destination ?? null,
    search: values.destination ? null : search,
    month: values.month ?? null,
    adults: clamp(values.adults ?? 2, 1, MAX_TOUR_ADULTS),
    children: clamp(values.children ?? 0, 0, MAX_TOUR_CHILDREN),
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
