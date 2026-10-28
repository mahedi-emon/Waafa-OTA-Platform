import {
  partOf,
  SITEMAP_PARTS,
  sitemapEntries,
  sitemapXml,
  type SitemapPart,
} from "@/lib/seo/sitemapEntries";

export function generateStaticParams() {
  return SITEMAP_PARTS.map((id) => ({ part: `${id}.xml` }));
}

/** One area of the sitemap (issue 287): /sitemap/pages.xml, /sitemap/travel.xml, … listed by /sitemap.xml. */
export async function GET(_request: Request, context: { params: Promise<{ part: string }> }) {
  const { part } = await context.params;
  const id = part.replace(/\.xml$/, "") as SitemapPart;
  if (!SITEMAP_PARTS.includes(id) || !part.endsWith(".xml")) {
    return new Response("Not found", { status: 404 });
  }
  const entries = (await sitemapEntries()).filter((entry) => partOf(entry.url) === id);
  return new Response(sitemapXml(entries), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
