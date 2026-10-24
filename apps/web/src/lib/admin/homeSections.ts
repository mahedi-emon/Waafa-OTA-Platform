import type { ContentKey, HomeSection } from "@waafa/shared";

/*
 * What each home section shows and where its content is edited (D0 R7, ADMIN.md §5.8): the home page manager lists
 * them with a thumbnail from their own content and links to the lists that feed them. Words live in
 * Admin.website.sections; this file holds only the wiring.
 */

export type HomeSectionKey = HomeSection["key"];

export type HomeSectionInfo = {
  /** The lists and settings this section shows, in the order staff look for them. */
  content: ContentKey[];
  /** The list whose first record's photo is the section's thumbnail (the hero uses its own photo or video). */
  thumbFrom?: ContentKey;
  /** The section's own heading words (kicker, heading, line under it) can be changed here. */
  headings: boolean;
};

export const HOME_SECTIONS: Record<HomeSectionKey, HomeSectionInfo> = {
  hero: { content: ["homeContent", "mediaSlots"], headings: false },
  trust: { content: ["trustItems"], headings: false },
  offers: { content: ["banners"], thumbFrom: "banners", headings: true },
  groupFares: { content: ["groupFares"], headings: true },
  destinations: { content: ["destinations"], thumbFrom: "destinations", headings: true },
  packages: { content: ["tourPackages"], thumbFrom: "tourPackages", headings: true },
  visa: { content: ["visaCountries"], thumbFrom: "visaCountries", headings: true },
  why: { content: ["homeContent", "values"], headings: true },
  store: {
    content: ["homeContent", "products", "storeRows"],
    thumbFrom: "products",
    headings: true,
  },
  testimonials: { content: [], headings: true },
  galleryBlogFaq: {
    content: ["galleryAlbums", "blogPosts", "faqs", "homeContent"],
    thumbFrom: "galleryAlbums",
    headings: true,
  },
  team: { content: ["team"], thumbFrom: "team", headings: true },
  cta: { content: ["homeContent"], headings: false },
};

/** The lists the manager reads one photo from, each once. */
export const THUMB_SOURCES = [
  ...new Set(
    Object.values(HOME_SECTIONS).flatMap((info) => (info.thumbFrom ? [info.thumbFrom] : [])),
  ),
];

/** The ids in a new order after moving one section (the list keeps everything else as it was). */
export function movedOrder(ids: readonly string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return [...ids];
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as string);
  return next;
}
