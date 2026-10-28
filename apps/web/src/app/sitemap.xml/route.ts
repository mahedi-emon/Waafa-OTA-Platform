import { SITEMAP_PARTS } from "@/lib/seo/sitemapEntries";
import { absoluteUrl } from "@/lib/siteUrl";

/** The sitemap index (issue 287): robots.txt and Search Console point here; it names each part of the sitemap. */
export function GET() {
  const parts = SITEMAP_PARTS.map(
    (id) => `  <sitemap><loc>${absoluteUrl(`/sitemap/${id}.xml`)}</loc></sitemap>`,
  ).join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts}\n</sitemapindex>\n`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
