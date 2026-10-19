import type { ResolvedField } from "@/lib/admin/blueprints/types";

/** Widgets that take the full width of the form; short fields sit two to a row from 768 px. */
const WIDE = new Set<ResolvedField["widget"]>([
  "textarea",
  "richText",
  "slug",
  "group",
  "union",
  "repeater",
  "lines",
  "tags",
  "choices",
  "references",
  "image",
  "seo",
  "map",
  "json",
  "weekdays",
]);

export function isWide(field: ResolvedField | undefined): boolean {
  return Boolean(field?.wide) || WIDE.has(field?.widget ?? "json");
}
