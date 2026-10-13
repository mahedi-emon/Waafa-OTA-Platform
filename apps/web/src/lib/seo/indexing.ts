import type { Metadata } from "next";

/** Any admin record with a public page of its own: packages, visa countries and guides, posts, routes, products. */
type IndexableRecord = { sample: boolean; seo?: { noIndex?: boolean } };

/**
 * Search engines index a record's page only when it is real content (issue 168): a record still marked Sample, or one
 * the admin set to SEO › noindex, stays out of the index and the sitemap. Turning Sample off in Admin indexes it again.
 */
export function isIndexable(record: IndexableRecord): boolean {
  return !record.sample && !record.seo?.noIndex;
}

/**
 * The robots metadata for a record's page: nothing (the layout's index, follow applies) when it is indexable,
 * otherwise noindex, follow, so crawlers still follow its links to the real pages.
 */
export function recordRobots(record: IndexableRecord): Pick<Metadata, "robots"> {
  return isIndexable(record) ? {} : { robots: { index: false, follow: true } };
}
