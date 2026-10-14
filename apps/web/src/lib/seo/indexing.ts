import type { Metadata } from "next";

/**
 * Any admin record with a public page of its own: packages, visa countries and guides, posts, routes, products,
 * brands, collections and albums. Every record carries `sample`; it no longer decides indexing (issue 183).
 */
type IndexableRecord = { sample?: boolean; seo?: { noIndex?: boolean } };

/**
 * Search engines index every published record page unless the admin turns on its SEO › noindex switch (issue 183).
 * The Sample flag is a label for visitors and the admin only: the live site went out with its records marked Sample,
 * and keeping them out of Google (issue 168) hid About Us and every visa, route, package and product page.
 */
export function isIndexable(record: IndexableRecord): boolean {
  return !record.seo?.noIndex;
}

/**
 * The robots metadata for a record's page: nothing (the layout's index, follow applies) when it is indexable,
 * otherwise noindex, follow, so crawlers still follow its links to the other pages.
 */
export function recordRobots(record: IndexableRecord): Pick<Metadata, "robots"> {
  return isIndexable(record) ? {} : { robots: { index: false, follow: true } };
}
