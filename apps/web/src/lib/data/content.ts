import "server-only";
import type { Banner, FeedbackService, GalleryCategory, MediaSlotKey } from "@waafa/shared";
import { cacheLife, cacheTag } from "next/cache";
import { repositories } from "./source";
import { CACHE_TAGS } from "./tags";
import type { BaggageQuery, BlogQuery, FaqQuery, TeamPlacement } from "./types";

/* Cached content accessors (pages, blog, FAQs, banners, home sections, gallery, feedback, team). */

export async function getPage(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.pages);
  return repositories.content.getPage(slug);
}

export async function listBlogCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.blog);
  return repositories.content.listBlogCategories();
}

export async function listBlogPosts(query: BlogQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.blog);
  return repositories.content.listBlogPosts(query);
}

export async function getBlogPost(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.blog);
  return repositories.content.getBlogPost(slug);
}

export async function listRelatedBlogPosts(slug: string, limit?: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.blog);
  return repositories.content.listRelatedBlogPosts(slug, limit);
}

export async function listFaqs(query: FaqQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.faqs);
  return repositories.content.listFaqs(query);
}

/** Re-checked every few minutes so scheduled offers start and end on time. */
export async function listBanners(placement: Banner["placement"]) {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.banners);
  return repositories.content.listBanners(placement, new Date());
}

export async function listTrustItems() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);
  return repositories.content.listTrustItems();
}

export async function listValues() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);
  return repositories.content.listValues();
}

export async function listTimeline() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);
  return repositories.content.listTimeline();
}

export async function listDestinations() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.home);
  return repositories.content.listDestinations();
}

export async function listGalleryAlbums(category?: GalleryCategory) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.gallery);
  return repositories.content.listGalleryAlbums(category);
}

export async function getGalleryAlbum(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.gallery);
  return repositories.content.getGalleryAlbum(slug);
}

export async function listPublicFeedback(service?: FeedbackService) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.feedback);
  return repositories.content.listPublicFeedback(service);
}

export async function listTeam(placement: TeamPlacement) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.team);
  return repositories.content.listTeam(placement);
}

export async function listBaggageRules(query: BaggageQuery = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.baggage);
  return repositories.content.listBaggageRules(query);
}

export async function listEmiBanks() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);
  return repositories.content.listEmiBanks();
}

export async function getMediaSlot(key: MediaSlotKey) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.media);
  return repositories.content.getMediaSlot(key);
}
