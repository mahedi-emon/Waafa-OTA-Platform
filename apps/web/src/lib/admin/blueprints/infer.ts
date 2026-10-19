import type { FieldSpec, ResolvedField } from "./types";
import type { SchemaFieldInfo } from "./walk";

/** Amounts in taka, by field name, when a blueprint doesn't say. */
const MONEY_NAMES = new Set([
  "fromPrice",
  "price",
  "farePerAdult",
  "charge",
  "codLimit",
  "minimumOrder",
  "freeDeliveryThreshold",
  "minimumAmount",
  "serviceCharge",
  "embassyFee",
  "dealPrice",
  "mrp",
  "minOrder",
  "maxDiscount",
  "maxPrice",
]);

/** Lists of sentences (shown as bullet lists on the site): one line each, in order. */
const LINE_NAMES = new Set([
  "inclusions",
  "exclusions",
  "terms",
  "notes",
  "tips",
  "perks",
  "rotating",
  "addressLines",
  "highlights",
  "includesShort",
  "lines",
  "description",
]);

const LONG_TEXT =
  /^(body|description|answer|content|bio|about|lead|notes?|summary|intro|excerpt|message|instructions|terms|policy|details)$/i;

const isPhoto = (info: SchemaFieldInfo) =>
  info.kind === "object" &&
  Boolean(info.node.properties?.src) &&
  Boolean(info.node.properties?.alt);

/** The widget for a field: the blueprint's choice, else what its schema suggests. */
export function inferWidget(
  info: SchemaFieldInfo,
  spec: FieldSpec | undefined,
): ResolvedField["widget"] {
  if (spec?.widget) return spec.widget;
  const name = info.name;
  switch (info.kind) {
    case "object":
      if (isPhoto(info)) return "image";
      if (!info.node.properties) return info.node.additionalProperties ? "map" : "json";
      return "group";
    case "array":
      if (info.item === "object" || info.item === "union") return "repeater";
      if (info.values) return "choices";
      if (info.item === "string" || info.item === "number" || info.item === "integer")
        return LINE_NAMES.has(name) ? "lines" : "tags";
      return "json";
    case "union":
      return "union";
    case "boolean":
      return "switch";
    case "number":
    case "integer":
      return MONEY_NAMES.has(name) ? "money" : "number";
    case "string": {
      const node = info.node;
      if (node.format === "html") return "richText";
      if (node.format === "date") return "date";
      if (node.format === "date-time") return "dateTime";
      if (info.values) return "choice";
      if (typeof node.maxLength === "number" ? node.maxLength > 200 : LONG_TEXT.test(name))
        return "textarea";
      return "text";
    }
    default:
      return "json";
  }
}
