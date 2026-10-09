type JsonLdProps = {
  /** A schema.org object (or graph) built from data-layer values. */
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Structured data script. One of the two places allowed to set raw HTML (Decision D38): the content is JSON with
 * `<` escaped, so no markup can break out of the script element.
 */
function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export { JsonLd };
