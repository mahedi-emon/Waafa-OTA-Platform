import type { FixtureData } from "@waafa/fixtures";
import { FaqCategorySchema, type BlogPost, type PublicFeedback } from "@waafa/shared";
import { byAdminOrder, isScheduledNow, matchesSearch, paginate } from "../query";
import type { ContentRepository } from "../types";

const FAQ_CATEGORY_ORDER = FaqCategorySchema.options;

function newestFirst(a: BlogPost, b: BlogPost): number {
  return b.publishedAt.localeCompare(a.publishedAt);
}

export function createFixtureContentRepository(data: FixtureData): ContentRepository {
  const publishedPosts = () => data.blogPosts.filter((post) => post.status === "published");

  return {
    async getPage(slug) {
      return data.pages.find((page) => page.slug === slug && page.status === "published") ?? null;
    },

    async listBlogCategories() {
      return [...data.blogCategories];
    },

    async listBlogPosts(query = {}) {
      const posts = publishedPosts()
        .filter((post) => !query.category || post.category === query.category)
        .filter((post) => matchesSearch([post.title, post.excerpt, post.intro], query.search))
        .sort(newestFirst);
      return paginate(posts, query, 9);
    },

    async getBlogPost(slug) {
      return publishedPosts().find((post) => post.slug === slug) ?? null;
    },

    async listRelatedBlogPosts(slug, limit = 3) {
      const current = publishedPosts().find((post) => post.slug === slug);
      const others = publishedPosts()
        .filter((post) => post.slug !== slug)
        .sort(newestFirst);
      if (!current) return others.slice(0, limit);
      const sameCategory = others.filter((post) => post.category === current.category);
      const rest = others.filter((post) => post.category !== current.category);
      return [...sameCategory, ...rest].slice(0, limit);
    },

    async listFaqs(query = {}) {
      return data.faqs
        .filter((faq) => !query.category || faq.category === query.category)
        .filter((faq) => query.onHome === undefined || faq.onHome === query.onHome)
        .filter((faq) => matchesSearch([faq.question, faq.answer], query.search))
        .sort(
          (a, b) =>
            FAQ_CATEGORY_ORDER.indexOf(a.category) - FAQ_CATEGORY_ORDER.indexOf(b.category) ||
            a.order - b.order,
        );
    },

    async listBanners(placement, now) {
      return byAdminOrder(
        data.banners.filter(
          (banner) =>
            banner.placement === placement && banner.enabled && isScheduledNow(banner, now),
        ),
      );
    },

    async listTrustItems() {
      return byAdminOrder(data.trustItems);
    },

    async listValues() {
      return byAdminOrder(data.values);
    },

    async listTimeline() {
      return byAdminOrder(data.timeline);
    },

    async listDestinations() {
      return byAdminOrder(data.destinations);
    },

    async listGalleryAlbums(category) {
      return data.galleryAlbums
        .filter((album) => !category || album.category === category)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    },

    async getGalleryAlbum(slug) {
      return data.galleryAlbums.find((album) => album.slug === slug) ?? null;
    },

    async listPublicFeedback(service) {
      return (
        data.feedback
          .filter((item) => item.status === "approved" && item.consentToPublish)
          .filter((item) => !service || item.service === service)
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
          // Contact details and moderation fields never leave the server.
          .map(
            ({ id, name, service: used, rating, comment, photo, submittedAt }): PublicFeedback => ({
              id,
              name,
              service: used,
              rating,
              comment,
              photo,
              submittedAt,
            }),
          )
      );
    },

    async listTeam(placement) {
      return data.team
        .filter(
          (member) =>
            member.visible && (placement === "home" ? member.showOnHome : member.showOnAbout),
        )
        .sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
    },

    async listBaggageRules(query = {}) {
      return data.baggageRules
        .filter((rule) => !query.scope || rule.scope === query.scope)
        .filter((rule) => matchesSearch([rule.airlineName, rule.airlineCode], query.search))
        .sort((a, b) => a.airlineName.localeCompare(b.airlineName));
    },

    async listEmiBanks() {
      return [...data.emiBanks];
    },
  };
}
