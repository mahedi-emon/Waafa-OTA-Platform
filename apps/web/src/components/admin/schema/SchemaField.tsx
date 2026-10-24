"use client";

import { patternOf } from "@/lib/admin/blueprints/paths";
import {
  getAt,
  isNullable,
  resolve,
  unionOf,
  type JsonSchema,
  type Path,
} from "@/lib/admin/schema";
import { ChoiceField } from "./ChoiceField";
import { ChoicesField } from "./ChoicesField";
import { ColourField } from "./ColourField";
import { DateField } from "./DateField";
import { DateTimeField } from "./DateTimeField";
import { IconField } from "./IconField";
import { LinkField } from "./LinkField";
import { LazyGalleryField } from "./LazyGalleryField";
import { LazyMediaField } from "./LazyMediaField";
import { LazyVideoField } from "./LazyVideoField";
import { LinesField } from "./LinesField";
import { MapField } from "./MapField";
import { MoneyField } from "./MoneyField";
import { MonthsField } from "./MonthsField";
import { NumberField } from "./NumberField";
import { ObjectField } from "./ObjectField";
import { PhoneField } from "./PhoneField";
import { RawJsonField } from "./RawJsonField";
import { ReadOnlyField } from "./ReadOnlyField";
import { ReferenceField } from "./ReferenceField";
import { RepeaterField } from "./RepeaterField";
import { RichTextField } from "./RichTextField";
import { SeoField } from "./SeoField";
import { SlugField } from "./SlugField";
import { SwitchField } from "./SwitchField";
import { TagsField } from "./TagsField";
import { TextField } from "./TextField";
import { TimeOfDayField } from "./TimeOfDayField";
import { UnionField } from "./UnionField";
import { VariantField } from "./VariantField";
import { WeekdaysField } from "./WeekdaysField";
import { useSchemaEditor } from "./useSchemaEditor";

type SchemaFieldProps = {
  schema: JsonSchema;
  path: Path;
  value: unknown;
  optional: boolean;
  /** Draw a group's fields without a frame (list items, a section's own group, the record itself). */
  bare?: boolean;
};

/** Widgets that edit one value, so a value that may also be null is still drawn by them. */
const VALUE_WIDGETS = new Set([
  "text",
  "textarea",
  "richText",
  "slug",
  "money",
  "number",
  "date",
  "dateTime",
  "switch",
  "choice",
  "reference",
  "icon",
  "colour",
  "phone",
  "timeOfDay",
  "variant",
  "link",
  "readOnly",
]);

/**
 * Picks the widget for one field from its resolved blueprint entry (ADMIN.md §6), falling back to the schema's shape
 * for anything the blueprint leaves open. Hidden and automatic fields draw nothing.
 */
function SchemaField({ schema, path, value, optional, bare = false }: SchemaFieldProps) {
  const editor = useSchemaEditor();
  const node = resolve(schema, editor.root);
  if (node.const !== undefined) return null;
  const field = editor.blueprint.fields[patternOf(path)];
  if (field?.hidden) return null;
  const widget = field?.widget ?? "json";
  const union = unionOf(node, editor.root);
  const nullable = isNullable(node, editor.root);
  const single = union && union.options.length === 1 ? union.options[0] : undefined;
  // A value that may be null (a parent category, an embassy fee) is edited as the value itself.
  const target = single && VALUE_WIDGETS.has(widget) ? resolve(single, editor.root) : node;
  const common = { path, value, optional };

  if (
    union &&
    !(single && VALUE_WIDGETS.has(widget)) &&
    widget !== "image" &&
    widget !== "video" &&
    widget !== "gallery" &&
    widget !== "repeater"
  ) {
    return <UnionField options={union.options} nullable={union.nullable} {...common} />;
  }

  switch (widget) {
    case "text":
      return <TextField {...common} node={target} nullable={nullable} />;
    case "textarea":
      return <TextField {...common} node={target} nullable={nullable} multiline />;
    case "richText":
      return <RichTextField {...common} nullable={nullable} />;
    case "slug":
      return <SlugField path={path} value={value} />;
    case "money":
      return <MoneyField {...common} nullable={nullable} />;
    case "number":
      return <NumberField {...common} node={target} nullable={nullable} />;
    case "date":
      return <DateField {...common} nullable={nullable} />;
    case "dateTime":
      return <DateTimeField {...common} nullable={nullable} />;
    case "switch":
      return <SwitchField path={path} value={value} />;
    case "choice": {
      const from = field?.from;
      const options = from
        ? (getAt(editor.value, [...path.slice(0, -1), from.list]) as unknown[] | undefined)
            ?.map((item) => {
              const record = (item ?? {}) as Record<string, unknown>;
              return {
                value: String(record[from.value] ?? ""),
                label: String(record[from.label] ?? ""),
              };
            })
            .filter((option) => option.value)
        : undefined;
      return <ChoiceField {...common} nullable={nullable} {...(options ? { options } : {})} />;
    }
    case "choices":
      return <ChoicesField {...common} />;
    case "reference":
      return <ReferenceField {...common} nullable={nullable} />;
    case "references":
      return <ReferenceField {...common} nullable={nullable} multiple />;
    case "tags": {
      const item = resolve(
        (Array.isArray(node.items) ? node.items[0] : node.items) ?? {},
        editor.root,
      );
      return <TagsField {...common} item={item} />;
    }
    case "lines":
      return <LinesField {...common} />;
    case "months":
      return <MonthsField {...common} />;
    case "repeater":
      return <RepeaterField {...common} node={node} />;
    case "icon":
      return <IconField {...common} />;
    case "colour":
      return <ColourField {...common} />;
    case "phone":
      return <PhoneField {...common} />;
    case "timeOfDay":
      return <TimeOfDayField path={path} node={target} value={value} />;
    case "weekdays":
      return <WeekdaysField path={path} value={value} />;
    case "image":
      return (
        <LazyMediaField
          {...common}
          node={single ? resolve(single, editor.root) : node}
          nullable={nullable}
        />
      );
    case "gallery":
      return <LazyGalleryField {...common} node={single ? resolve(single, editor.root) : node} />;
    case "video":
      return (
        <LazyVideoField
          {...common}
          node={single ? resolve(single, editor.root) : node}
          nullable={nullable}
        />
      );
    case "seo":
      return <SeoField path={path} node={node} value={value} />;
    case "map":
      return <MapField path={path} value={value} />;
    case "variant":
      return <VariantField {...common} />;
    case "link":
      return <LinkField {...common} />;
    case "readOnly":
      return <ReadOnlyField path={path} value={value} />;
    case "group":
      return <ObjectField schema={node} {...common} optional={optional || nullable} bare={bare} />;
    default:
      return <RawJsonField path={path} value={value} optional={optional} />;
  }
}

export { SchemaField };
