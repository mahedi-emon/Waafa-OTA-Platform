import type { Airport } from "@waafa/shared";

/*
 * Recent searches (FR-SRCH-09) live in the visitor's browser only: never sent anywhere, capped, and
 * validated on read so a stale or edited entry can never break the card. The checks are plain functions (the same
 * rules as AirportSchema) so the search card's first load carries no zod (#39).
 */

export const SEARCH_MODULES = ["flights", "hotels", "packages", "visa"] as const;
export type SearchModule = (typeof SEARCH_MODULES)[number];

export const RECENT_SEARCHES_KEY = "waafa:recent-searches:v1";
export const MAX_RECENT_PER_MODULE = 3;
const MAX_RECENT_TOTAL = 12;
const MAX_RECENT_AIRPORTS = 4;

export type RecentSearch = {
  module: SearchModule;
  label: string;
  href: string;
  at: number;
  /** The airports of a flight search, for the "Recent" row in the airport picker. */
  airports?: Airport[];
};

const AIRPORT_KEYS = new Set(["iata", "city", "name", "country", "countryCode", "pinnedRank"]);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** AirportSchema's rules (strict object): IATA code, names, ISO country code, optional positive rank. */
function toAirport(value: unknown): Airport | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !AIRPORT_KEYS.has(key))) return null;
  const { iata, city, name, country, countryCode, pinnedRank } = value;
  if (typeof iata !== "string" || !/^[A-Z]{3}$/.test(iata)) return null;
  if (!text(city) || !text(name) || !text(country)) return null;
  if (typeof countryCode !== "string" || !/^[A-Z]{2}$/.test(countryCode)) return null;
  if (
    pinnedRank !== undefined &&
    !(typeof pinnedRank === "number" && Number.isInteger(pinnedRank) && pinnedRank > 0)
  )
    return null;
  return {
    iata,
    city,
    name,
    country,
    countryCode,
    ...(pinnedRank === undefined ? {} : { pinnedRank }),
  };
}

function toRecentSearch(value: unknown): RecentSearch | null {
  if (!isRecord(value)) return null;
  const { module, label, href, at, airports } = value;
  if (!SEARCH_MODULES.includes(module as SearchModule)) return null;
  if (!text(label) || label.length > 120) return null;
  // Same-site paths only: "//host" or "/\host" would leave the site.
  if (typeof href !== "string" || href.length > 600 || !/^\/(?![/\\])/.test(href)) return null;
  if (typeof at !== "number" || !Number.isInteger(at) || at < 0) return null;
  let list: Airport[] | undefined;
  if (airports !== undefined) {
    if (!Array.isArray(airports) || airports.length > 10) return null;
    const parsed = airports.map(toAirport);
    if (parsed.some((airport) => airport === null)) return null;
    list = parsed as Airport[];
  }
  return {
    module: module as SearchModule,
    label,
    href,
    at,
    ...(list ? { airports: list } : {}),
  };
}

export function parseRecentSearches(raw: string | null | undefined): RecentSearch[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      const parsed = toRecentSearch(item);
      return parsed ? [parsed] : [];
    });
  } catch {
    return [];
  }
}

/** Newest first, one entry per URL, at most three per module. */
export function addRecentSearch(list: RecentSearch[], entry: RecentSearch): RecentSearch[] {
  const next = [entry, ...list.filter((item) => item.href !== entry.href)];
  const perModule = new Map<SearchModule, number>();
  return next
    .filter((item) => {
      const count = perModule.get(item.module) ?? 0;
      perModule.set(item.module, count + 1);
      return count < MAX_RECENT_PER_MODULE;
    })
    .slice(0, MAX_RECENT_TOTAL);
}

export function recentForModule(list: RecentSearch[], module: SearchModule): RecentSearch[] {
  return list.filter((item) => item.module === module);
}

/** Airports from recent flight searches, newest first, without repeats. */
export function recentAirports(list: RecentSearch[], exclude: string[] = []): Airport[] {
  const seen = new Set(exclude);
  const airports: Airport[] = [];
  for (const item of list) {
    for (const airport of item.airports ?? []) {
      if (seen.has(airport.iata)) continue;
      seen.add(airport.iata);
      airports.push(airport);
    }
  }
  return airports.slice(0, MAX_RECENT_AIRPORTS);
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem">;

export function loadRecentSearches(storage: ReadableStorage | null | undefined): RecentSearch[] {
  try {
    return parseRecentSearches(storage?.getItem(RECENT_SEARCHES_KEY));
  } catch {
    return [];
  }
}

export function saveRecentSearch(
  storage: WritableStorage | null | undefined,
  entry: RecentSearch,
): RecentSearch[] {
  const next = addRecentSearch(loadRecentSearches(storage), entry);
  try {
    storage?.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // Private mode or a full quota: the search still runs, it just is not remembered.
  }
  return next;
}
