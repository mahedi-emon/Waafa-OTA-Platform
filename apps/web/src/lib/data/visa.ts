import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { repositories } from "./source";
import { CACHE_TAGS } from "./tags";
import type { VisaQuery } from "./types";

/* Cached visa accessors (country pages and guides). */

export async function listVisaCountries(query: VisaQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.visa);
  return repositories.visa.listVisaCountries(query);
}

export async function getVisaCountry(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.visa);
  return repositories.visa.getVisaCountry(slug);
}

export async function listVisaGuides() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.visa);
  return repositories.visa.listVisaGuides();
}

export async function getVisaGuide(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.visa);
  return repositories.visa.getVisaGuide(slug);
}
