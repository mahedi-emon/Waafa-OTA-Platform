import { absoluteUrl } from "@/lib/siteUrl";
import { JsonLd } from "./JsonLd";

type ItemListJsonLdProps = {
  /** What the list shows, e.g. "Tour packages". */
  name: string;
  /** The items in the order the page shows them; `path` is the item's own page. */
  items: Array<{ name: string; path: string; image?: string }>;
};

/**
 * ItemList structured data for listing pages (#96): packages, visa countries and articles, in page order, so search
 * engines read the list and can show it as a carousel. Nothing renders when the list is empty.
 */
function ItemListJsonLd({ name, items }: ItemListJsonLdProps) {
  if (items.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
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
      }}
    />
  );
}

export { ItemListJsonLd };
