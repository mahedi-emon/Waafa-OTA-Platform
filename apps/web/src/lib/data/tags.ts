/**
 * Cache tags for the cached accessors. The API's revalidation webhook (Phase C) uses the same names:
 * saving in Admin revalidates the tag, and the site follows within seconds (FR-GS-02).
 */
export const CACHE_TAGS = {
  /** Booking modes, payment switches, COD cap, maintenance. */
  config: "config",
  settings: "settings",
  menus: "menus",
  pages: "pages",
  blog: "blog",
  faqs: "faqs",
  banners: "banners",
  home: "home",
  gallery: "gallery",
  feedback: "feedback",
  team: "team",
  baggage: "baggage",
  airports: "airports",
  groupFares: "group-fares",
  packages: "packages",
  visa: "visa",
  catalogue: "catalogue",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
