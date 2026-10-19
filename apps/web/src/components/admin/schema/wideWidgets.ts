import type { ResolvedField } from "@/lib/admin/blueprints/types";
import type { JsonSchema } from "@/lib/admin/schema";

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
  "months",
  "references",
  "image",
  "seo",
  "map",
  "json",
  "weekdays",
]);

/** Text longer than this gets the full width (titles, summaries); shorter ones (names, codes) half. */
const SHORT_TEXT = 60;

export function isWide(field: ResolvedField | undefined, node?: JsonSchema): boolean {
  if (!field) return true;
  if (field.wide || WIDE.has(field.widget)) return true;
  switch (field.widget) {
    case "text":
      return typeof node?.maxLength === "number" && node.maxLength > SHORT_TEXT;
    case "choice":
      // Radio cards need room; two options fit side by side in half the width.
      return Boolean(field.from) || (field.choices?.length ?? 0) > 2;
    case "switch":
      return Boolean(field.help);
    default:
      return false;
  }
}
