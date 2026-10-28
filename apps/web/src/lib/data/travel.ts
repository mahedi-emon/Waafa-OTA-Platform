import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { repositories } from "./source";
import { CACHE_TAGS } from "./tags";
import type { PackageQuery } from "./types";

/* Cached travel accessors (airports, airlines, group fares, packages, hotel places). */

export async function listPinnedAirports() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.airports);
  return repositories.travel.listPinnedAirports();
}

export async function searchAirports(query: string, limit?: number) {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.airports);
  return repositories.travel.searchAirports(query, limit);
}

export async function getAirport(iata: string) {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.airports);
  return repositories.travel.getAirport(iata);
}

export async function listAirlines() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.airports);
  return repositories.travel.listAirlines();
}

export async function listFeaturedAirlines() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.airports);
  return repositories.travel.listFeaturedAirlines();
}

/** Re-checked every few minutes, so a fare disappears soon after it expires (FR-FLT-07). */
export async function listGroupFares(filters: { to?: string; month?: string } = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.groupFares);
  return repositories.travel.listGroupFares({ ...filters, now: new Date() });
}

/** Flight route landing pages (#99). */
export async function listFlightRoutes() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.flightRoutes);
  return repositories.travel.listFlightRoutes();
}

export async function getFlightRoute(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.flightRoutes);
  return repositories.travel.getFlightRoute(slug);
}

export async function getGroupFare(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.groupFares);
  return repositories.travel.getGroupFare(id, new Date());
}

export async function listPackages(query: PackageQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.packages);
  return repositories.travel.listPackages(query);
}

/** Curated hotels (FR-HTL-02, issue 249), published only. */
export async function listHotels() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.hotels);
  return repositories.travel.listHotels();
}

export async function getHotel(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.hotels);
  return repositories.travel.getHotel(slug);
}

export async function getPackage(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.packages);
  return repositories.travel.getPackage(slug);
}

export async function listRelatedPackages(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.packages);
  return repositories.travel.listRelatedPackages(slug);
}

export async function searchHotelPlaces(query: string, limit?: number) {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.airports);
  return repositories.travel.searchHotelPlaces(query, limit);
}
