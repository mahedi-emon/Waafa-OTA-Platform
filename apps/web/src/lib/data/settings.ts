import "server-only";
import type { MenuKey } from "@waafa/shared";
import { cacheLife, cacheTag } from "next/cache";
import { repositories } from "./source";
import { CACHE_TAGS } from "./tags";

/* Cached settings accessors. Pages and components import these, never the repositories directly. */

export async function getSiteSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getSiteSettings();
}

export async function getContactSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getContactSettings();
}

export async function getMenu(key: MenuKey) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.menus);
  return repositories.settings.getMenu(key);
}

export async function getFooterSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getFooterSettings();
}

/** Re-checked every few minutes, so a scheduled announcement appears and ends on time. */
export async function getActiveAnnouncement() {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getActiveAnnouncement(new Date());
}

/** Booking modes and payment switches, cached for 60 seconds (FR-GS-02). */
/**
 * Booking modes, payment switches, COD cap, maintenance. Saving in Admin revalidates the `config` tag at once
 * (FR-GS-02), so the entry can live for hours; a short cacheLife would push every page that reads it out of the
 * static App Shell.
 */
export async function getPublicConfig() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.config);
  return repositories.settings.getPublicConfig();
}

export async function getPaymentSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getPaymentSettings();
}

export async function getShippingSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getShippingSettings();
}

export async function getEmiSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getEmiSettings();
}

export async function getLeadFormSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getLeadFormSettings();
}

export async function getTrackingSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getTrackingSettings();
}

export async function listHomeSections() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);
  return repositories.settings.listHomeSections();
}

export async function getShopContent() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.settings.getShopContent();
}

export async function getHomeContent() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);
  return repositories.settings.getHomeContent();
}

export async function getSearchSettings() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.settings.getSearchSettings();
}
