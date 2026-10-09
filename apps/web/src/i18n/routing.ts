import { defineRouting } from "next-intl/routing";

/**
 * English ships at launch; Bangla (`bn`) joins in Phase 1B by adding it here and a `messages/bn.json`.
 * English URLs stay unprefixed (`/tour-packages`); other locales get a prefix (`/bn/tour-packages`).
 * The language changes only when the visitor picks it (no Accept-Language redirects, no locale cookie),
 * which keeps every English page cacheable.
 */
export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
