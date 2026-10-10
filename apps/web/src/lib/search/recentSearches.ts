import { AirportSchema, type Airport } from "@waafa/shared";
import { z } from "zod";

/*
 * Recent searches (FR-SRCH-09) live in the visitor's browser only: never sent anywhere, capped, and
 * validated on read so a stale or edited entry can never break the card.
 */

export const SEARCH_MODULES = ["flights", "hotels", "packages", "visa"] as const;
export type SearchModule = (typeof SEARCH_MODULES)[number];

export const RECENT_SEARCHES_KEY = "waafa:recent-searches:v1";
export const MAX_RECENT_PER_MODULE = 3;
const MAX_RECENT_TOTAL = 12;
const MAX_RECENT_AIRPORTS = 4;

const RecentSearchSchema = z.object({
  module: z.enum(SEARCH_MODULES),
  label: z.string().min(1).max(120),
  // Same-site paths only: "//host" or "/\host" would leave the site.
  href: z
    .string()
    .regex(/^\/(?![/\\])/)
    .max(600),
  at: z.number().int().nonnegative(),
  /** The airports of a flight search, for the "Recent" row in the airport picker. */
  airports: z.array(AirportSchema).max(10).optional(),
});

export type RecentSearch = z.infer<typeof RecentSearchSchema>;

export function parseRecentSearches(raw: string | null | undefined): RecentSearch[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      const parsed = RecentSearchSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
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
