import type { CollectionKey } from "./registry";

/*
 * Lists whose records have their own page on the site, addressed by the record's id (its slug or code) (D0 R4): a
 * changed link keeps the old address working through a permanent redirect. Each page knows its own path; the
 * admin's "View on site" link comes from the blueprint's address. No zod here: client code may import it (D202).
 */
export const ROUTED_KEYS = [
  "tourPackages",
  "flightRoutes",
  "visaCountries",
  "visaGuides",
  "blogPosts",
  "galleryAlbums",
  "pages",
  "products",
  "categories",
  "brands",
  "collections",
] as const satisfies readonly CollectionKey[];

export type RoutedKey = (typeof ROUTED_KEYS)[number];

export function isRoutedKey(key: string): key is RoutedKey {
  return (ROUTED_KEYS as readonly string[]).includes(key);
}
