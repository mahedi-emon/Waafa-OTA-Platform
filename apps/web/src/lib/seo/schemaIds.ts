import { absoluteUrl } from "@/lib/siteUrl";

type SchemaNode = "website" | "organization" | "agency" | "store";

/**
 * Stable `@id` values for the site's structured data (issue 125): every page points at the same website, company,
 * travel agency and store, so search engines join them into one entity instead of reading a new one per page.
 */
export function schemaId(node: SchemaNode): string {
  return `${absoluteUrl("/")}#${node}`;
}
