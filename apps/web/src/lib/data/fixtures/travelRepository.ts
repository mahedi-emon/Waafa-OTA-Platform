import type { FixtureData } from "@waafa/fixtures";
import type { Airport, TourPackage } from "@waafa/shared";
import { matchesSearch, normalizeText, paginate } from "../query";
import type { PackageSort, TravelRepository } from "../types";

/** Lower is better: exact code, code prefix, city prefix, word prefix, country prefix, anywhere. */
function airportScore(airport: Airport, query: string): number | null {
  const code = airport.iata.toLowerCase();
  const city = normalizeText(airport.city);
  const name = normalizeText(airport.name);
  const country = normalizeText(airport.country);
  if (code === query) return 0;
  if (code.startsWith(query)) return 1;
  if (city.startsWith(query)) return 2;
  if (`${city} ${name}`.split(/\s+/).some((word) => word.startsWith(query))) return 3;
  if (country.startsWith(query)) return 4;
  if (`${city} ${name} ${country}`.includes(query)) return 5;
  return null;
}

const PACKAGE_SORTS: Record<PackageSort, (a: TourPackage, b: TourPackage) => number> = {
  popular: (a, b) => b.popularity - a.popularity,
  "price-asc": (a, b) => a.fromPrice - b.fromPrice,
  "price-desc": (a, b) => b.fromPrice - a.fromPrice,
  shortest: (a, b) => a.durationDays - b.durationDays || a.fromPrice - b.fromPrice,
};

export function createFixtureTravelRepository(data: FixtureData): TravelRepository {
  const published = () => data.tourPackages.filter((pkg) => pkg.status === "published");
  const isOnOffer = (expiresAt: string, now: Date) => Date.parse(expiresAt) > now.getTime();

  return {
    async listPinnedAirports() {
      return data.airports
        .filter((airport) => airport.pinnedRank !== undefined)
        .sort((a, b) => (a.pinnedRank ?? 0) - (b.pinnedRank ?? 0));
    },

    async searchAirports(query, limit = 8) {
      const needle = normalizeText(query);
      if (!needle) return [];
      return data.airports
        .map((airport) => ({ airport, score: airportScore(airport, needle) }))
        .filter((hit): hit is { airport: Airport; score: number } => hit.score !== null)
        .sort(
          (a, b) =>
            a.score - b.score ||
            (a.airport.pinnedRank ?? Number.MAX_SAFE_INTEGER) -
              (b.airport.pinnedRank ?? Number.MAX_SAFE_INTEGER) ||
            a.airport.city.localeCompare(b.airport.city),
        )
        .slice(0, limit)
        .map((hit) => hit.airport);
    },

    async getAirport(iata) {
      return data.airports.find((airport) => airport.iata === iata.toUpperCase()) ?? null;
    },

    async listAirlines() {
      return [...data.airlines];
    },

    async listFeaturedAirlines() {
      return data.airlines
        .filter((airline) => airline.featuredOrder !== undefined)
        .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
    },

    async listGroupFares({ now, to, month }) {
      return data.groupFares
        .filter((fare) => isOnOffer(fare.expiresAt, now))
        .filter((fare) => !to || fare.to.iata === to.toUpperCase())
        .filter((fare) => !month || fare.departDate.startsWith(month))
        .sort(
          (a, b) => a.departDate.localeCompare(b.departDate) || a.farePerAdult - b.farePerAdult,
        );
    },

    async getGroupFare(id, now) {
      const fare = data.groupFares.find((candidate) => candidate.id === id);
      return fare && isOnOffer(fare.expiresAt, now) ? fare : null;
    },

    async listPackages(query = {}) {
      const packages = published()
        .filter((pkg) =>
          matchesSearch([pkg.title, pkg.summary, pkg.placesLabel, ...pkg.countries], query.search),
        )
        .filter((pkg) => !query.category || pkg.categories.includes(query.category))
        .filter((pkg) => !query.destination || pkg.destinationSlug === query.destination)
        .filter((pkg) => query.minNights === undefined || pkg.durationNights >= query.minNights)
        .filter((pkg) => query.maxNights === undefined || pkg.durationNights <= query.maxNights)
        .filter((pkg) => query.minPrice === undefined || pkg.fromPrice >= query.minPrice)
        .filter((pkg) => query.maxPrice === undefined || pkg.fromPrice <= query.maxPrice)
        .filter((pkg) => !query.month || pkg.months.includes(query.month))
        .filter((pkg) => (query.includes ?? []).every((chip) => pkg.includesShort.includes(chip)))
        .sort(PACKAGE_SORTS[query.sort ?? "popular"]);
      return paginate(packages, query, 9);
    },

    async getPackage(slug) {
      return published().find((pkg) => pkg.slug === slug) ?? null;
    },

    async listRelatedPackages(slug) {
      const current = published().find((pkg) => pkg.slug === slug);
      if (!current) return [];
      return current.relatedSlugs.flatMap((related) =>
        published().filter((pkg) => pkg.slug === related),
      );
    },

    async searchHotelPlaces(query, limit = 8) {
      const places = query.trim()
        ? data.hotelPlaces.filter((place) =>
            matchesSearch([place.name, place.city, place.country], query),
          )
        : data.hotelPlaces.filter((place) => place.popular);
      return places.slice(0, limit);
    },
  };
}
