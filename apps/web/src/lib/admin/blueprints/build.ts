import { CONTENT_MODEL, type ContentKey } from "@waafa/shared";
import { humanize } from "../format";
import type { JsonSchema } from "../schema";
import { inferWidget } from "./infer";
import { BLUEPRINTS } from "./registry";
import type { ResolvedBlueprint, ResolvedField } from "./types";
import { walkSchema } from "./walk";

/** Looks up a message under Admin ("fieldNames.title"); undefined when there is none. */
export type Words = (key: string) => string | undefined;

/** Fields the system owns on every record: never drawn in a section. */
const SYSTEM_FIELDS = new Set(["status", "sample"]);

/** Web addresses and site paths are read whole, so these texts take the full row. */
const ADDRESS_NAMES = new Set(["href", "url", "mapUrl"]);

/**
 * A blueprint with every word resolved and every field's widget decided, ready for the editor. Words come from
 * Admin.blueprints.<key> first (record-specific labels and help), then the shared Admin.fieldNames / fieldHelp /
 * choices; a missing label falls back to the field name (the blueprint tests make sure that never ships).
 */
export function buildResolvedBlueprint(
  key: ContentKey,
  schema: JsonSchema,
  words: Words,
): ResolvedBlueprint {
  const blueprint = BLUEPRINTS[key];
  const entry = CONTENT_MODEL[key];
  const base = `blueprints.${key}`;
  const infos = walkSchema(schema);
  const top = (name: string) => infos.find((info) => info.parent === "" && info.name === name);
  const statusValues = top("status")?.values ?? [];
  const workflow = statusValues.includes("draft") && statusValues.includes("published");

  const fields: Record<string, ResolvedField> = {};
  for (const info of infos) {
    if (info.pattern === "" && info.kind === "object") continue;
    const spec = blueprint.fields?.[info.pattern];
    const widget = inferWidget(info, spec);
    // A list item is named like its list ("Prices"), unless the blueprint names one item ("Price").
    const label =
      words(`${base}.fields.${info.pattern}`) ??
      (info.name === "item" && info.parent !== null ? fields[info.parent]?.label : undefined) ??
      words(`fieldNames.${info.name}`) ??
      humanize(info.name || key);
    const help = words(`${base}.help.${info.pattern}`) ?? words(`fieldHelp.${info.name}`);
    const system = info.parent === "" && SYSTEM_FIELDS.has(info.name);
    const hidden = Boolean(spec?.auto) || (system && (info.name === "sample" || workflow));
    const set = spec?.choices ?? info.name;
    const choices = info.values?.map((value) => ({
      value,
      label: words(`choices.${set}.${value}`) ?? humanize(value),
    }));
    const ref = spec?.ref
      ? {
          ...spec.ref,
          nouns: {
            one: words(`blueprints.${spec.ref.key}.one`) ?? humanize(spec.ref.key),
            other: words(`blueprints.${spec.ref.key}.other`) ?? humanize(spec.ref.key),
          },
        }
      : undefined;
    fields[info.pattern] = {
      label,
      widget,
      ...(help ? { help } : {}),
      ...(hidden ? { hidden } : {}),
      ...(spec?.auto ? { auto: spec.auto } : {}),
      ...(choices?.length ? { choices } : {}),
      ...(ref ? { ref } : {}),
      ...(spec?.summary ? { summary: spec.summary } : {}),
      ...(spec?.fixed ? { fixed: true } : {}),
      ...(spec?.prefix ? { prefix: spec.prefix } : {}),
      ...(spec?.source ? { source: spec.source } : {}),
      ...(spec?.wide || (widget === "text" && ADDRESS_NAMES.has(info.name)) ? { wide: true } : {}),
      ...(spec?.order ? { order: spec.order } : {}),
      ...(spec?.from ? { from: spec.from } : {}),
      ...(spec?.variantOf ? { variantOf: spec.variantOf } : {}),
    };
  }

  const placed = new Set([
    ...blueprint.sections.flatMap((section) => section.fields),
    ...(blueprint.visibility ?? []),
  ]);
  const advanced = infos
    .filter(
      (info) =>
        info.parent === "" &&
        info.name !== "item" &&
        !placed.has(info.name) &&
        !fields[info.pattern]?.hidden,
    )
    .map((info) => info.name);

  const publish = (blueprint.publish ?? []).map((pattern) => {
    // "cover_src" reads better as the photo it belongs to.
    const owner = pattern.endsWith("_src") ? pattern.slice(0, -"_src".length) : pattern;
    return { path: pattern, label: fields[owner]?.label ?? fields[pattern]?.label ?? pattern };
  });

  return {
    key,
    kind: entry.kind,
    ...(entry.kind === "collection"
      ? { idField: entry.idField, titleField: entry.titleField }
      : {}),
    nouns: {
      one: words(`${base}.one`) ?? humanize(key),
      other: words(`${base}.other`) ?? humanize(key),
    },
    intro: words(`${base}.intro`) ?? "",
    sections: blueprint.sections.map((section) => {
      const lead = words(`${base}.sectionLeads.${section.id}`);
      return {
        id: section.id,
        title: words(`${base}.sections.${section.id}`) ?? humanize(section.id),
        ...(lead ? { lead } : {}),
        fields: section.fields,
      };
    }),
    fields,
    advanced,
    visibility: blueprint.visibility ?? [],
    ...(blueprint.url ? { url: blueprint.url } : {}),
    ...(blueprint.heading ? { heading: blueprint.heading } : {}),
    publish,
    workflow,
    sample: Boolean(top("sample")),
    seo: Boolean(top("seo")),
  };
}
