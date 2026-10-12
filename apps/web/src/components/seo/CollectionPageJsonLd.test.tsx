import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CollectionPageJsonLd } from "./CollectionPageJsonLd";

/** The JSON inside the rendered script element. */
function parse(markup: string): Record<string, unknown> {
  const start = markup.indexOf(">") + 1;
  const json = markup.slice(start, markup.lastIndexOf("</script>"));
  return JSON.parse(json) as Record<string, unknown>;
}

describe("CollectionPageJsonLd", () => {
  it("lists the items in page order under the page, joined to the website", () => {
    const markup = renderToStaticMarkup(
      <CollectionPageJsonLd
        type="ImageGallery"
        path="/gallery"
        name="Gallery"
        description="Albums"
        items={[
          { name: "Bali", path: "/gallery/bali", image: "/media/bali.jpg" },
          { name: "Kashmir", path: "/gallery/kashmir" },
        ]}
      />,
    );
    const data = parse(markup);
    expect(data["@type"]).toBe("ImageGallery");
    expect(data["@id"]).toMatch(/\/gallery#page$/);
    expect((data.isPartOf as { "@id": string })["@id"]).toMatch(/#website$/);
    const list = data.mainEntity as {
      numberOfItems: number;
      itemListElement: Array<{ position: number; url: string; image?: string }>;
    };
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(list.itemListElement[0]?.url).toMatch(/^https?:\/\/.+\/gallery\/bali$/);
    expect(list.itemListElement[0]?.image).toMatch(/^https?:\/\/.+\/media\/bali\.jpg$/);
    expect(list.itemListElement[1]).not.toHaveProperty("image");
  });

  it("describes the page without an empty list when nothing is published", () => {
    const markup = renderToStaticMarkup(
      <CollectionPageJsonLd path="/visa-guide" name="Guides" description="Guides" items={[]} />,
    );
    const data = parse(markup);
    expect(data["@type"]).toBe("CollectionPage");
    expect(data).not.toHaveProperty("mainEntity");
  });
});
