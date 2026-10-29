import { defineRouting } from "next-intl/routing";

/**
 * English and Bangla (issue 254). Bangla carries every public string (`messages/bn.json`); the admin and llms.txt stay
 * English (request.ts fills those namespaces from English).
 * English URLs stay unprefixed (`/tour-packages`); other locales get a prefix (`/bn/tour-packages`).
 * The language changes only when the visitor picks it (no Accept-Language redirects, no locale cookie),
 * which keeps every English page cacheable.
 */
export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
