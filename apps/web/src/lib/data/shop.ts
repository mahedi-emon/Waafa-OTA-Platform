import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { repositories } from "./source";
import { CACHE_TAGS } from "./tags";
import type { ProductQuery } from "./types";

/* Cached Waafas World accessors. Stock and prices change often, so catalogue reads refresh in minutes. */

export async function listCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listCategories();
}

export async function getCategory(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.getCategory(slug);
}

export async function getAttributeSet(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.getAttributeSet(id);
}

export async function listBrands() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listBrands();
}

export async function getBrand(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.getBrand(slug);
}

export async function listProducts(query: ProductQuery = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listProducts(query);
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.getProduct(slug);
}

export async function listCollections() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listCollections();
}

export async function getCollection(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.getCollection(slug);
}

export async function listDeals() {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listDeals(new Date());
}

export async function listStoreRows() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listStoreRows();
}

export async function listCompatibleModels(brand?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.listCompatibleModels(brand);
}

export async function findCompatibleProducts(query: { modelId: string } | { partCode: string }) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.catalogue);
  return repositories.shop.findCompatibleProducts(query);
}

/** Not cached: coupon checks happen at checkout, against the current time. */
export async function findCoupon(code: string) {
  return repositories.shop.findCoupon(code, new Date());
}
