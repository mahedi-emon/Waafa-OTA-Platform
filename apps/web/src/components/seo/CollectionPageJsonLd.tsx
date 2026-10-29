import { getLocale } from "next-intl/server";
import { absoluteUrl } from "@/lib/siteUrl";
import { schemaId } from "@/lib/seo/schemaIds";
import { JsonLd } from "./JsonLd";

type CollectionPageJsonLdProps = {
  /** `ImageGallery` for photo albums; `CollectionPage` for any other index page. */
  type?: "CollectionPage" | "ImageGallery";
  /** The page's own path, e.g. "/visa-guide". */
  path: string;
  name: string;
  description: string;
  /** The items in the order the page shows them; `path` is the item's own page. */
  items: Array<{ name: string; path: string; image?: string }>;
};

/**
 * CollectionPage (or ImageGallery) with its ItemList as the main entity (issue 125), part of the site's WebSite node.
 * Index pages without a list (nothing published yet) still describe themselves, with no empty ItemList.
 */
async function CollectionPageJsonLd({
  type = "CollectionPage",
  path,
  name,
  description,
  items,
}: CollectionPageJsonLdProps) {
  const locale = await getLocale();
  const url = absoluteUrl(locale === "bn" ? (path === "/" ? "/bn" : `/bn${path}`) : path);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": type,
        "@id": `${url}#page`,
        url,
        name,
        description,
        inLanguage: locale === "bn" ? "bn-BD" : "en-BD",
        isPartOf: { "@id": schemaId("website") },
        publisher: { "@id": schemaId("organization") },
        ...(items.length > 0
          ? {
              mainEntity: {
                "@type": "ItemList",
                name,
                numberOfItems: items.length,
                itemListElement: items.map((item, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  url: absoluteUrl(item.path),
                  name: item.name,
                  ...(item.image ? { image: absoluteUrl(item.image) } : {}),
                })),
              },
            }
          : {}),
      }}
    />
  );
}

export { CollectionPageJsonLd };
