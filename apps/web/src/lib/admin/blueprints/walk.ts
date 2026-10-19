import { discriminatorOf, resolve, typeOf, unionOf, type JsonSchema } from "../schema";
import { childPattern } from "./paths";

/** One field of a content schema, as the blueprint engine sees it. */
export type SchemaFieldInfo = {
  pattern: string;
  /** The field's own name; "item" for list items, "" for the root. */
  name: string;
  /** Pattern of the group or list it belongs to ("" for top-level fields). */
  parent: string | null;
  node: JsonSchema;
  kind: "object" | "array" | "string" | "number" | "integer" | "boolean" | "union" | "unknown";
  /** Required in its group (list items always are). */
  required: boolean;
  nullable: boolean;
  /** Allowed values of an enum, or of a list of enum values. */
  values?: string[];
  /** For lists: what each item is. */
  item?: SchemaFieldInfo["kind"];
  /** For a union of groups: the field that tells them apart ("kind", "type"). */
  discriminator?: string;
};

const kindOf = (node: JsonSchema): SchemaFieldInfo["kind"] => {
  const type = typeOf(node);
  if (
    type === "object" ||
    type === "array" ||
    type === "string" ||
    type === "number" ||
    type === "integer" ||
    type === "boolean"
  )
    return type;
  return "unknown";
};

const enumValues = (node: JsonSchema): string[] | undefined =>
  node.enum?.every((value) => typeof value === "string") ? (node.enum as string[]) : undefined;

/**
 * Every field of a content schema by pattern, parents before children. Unions of groups merge their options' fields
 * under one pattern (a gallery item's photo and video fields); a nullable value is walked as the value itself.
 */
export function walkSchema(root: JsonSchema): SchemaFieldInfo[] {
  const out = new Map<string, SchemaFieldInfo>();

  const add = (info: SchemaFieldInfo) => {
    const known = out.get(info.pattern);
    if (!known) {
      out.set(info.pattern, info);
      return;
    }
    // The same field in two union options: it is required only if both say so; values add up.
    known.required = known.required && info.required;
    if (info.values) known.values = [...new Set([...(known.values ?? []), ...info.values])];
  };

  const visit = (
    schema: JsonSchema,
    pattern: string,
    name: string,
    parent: string | null,
    required: boolean,
    depth: number,
  ) => {
    if (depth > 12) return;
    const node = resolve(schema, root);
    const union = unionOf(node, root);
    if (union) {
      if (union.options.length === 1 && union.options[0]) {
        const single = resolve(union.options[0], root);
        visitNode(single, pattern, name, parent, required, true, depth);
        return;
      }
      const discriminator = discriminatorOf(union.options) ?? undefined;
      add({
        pattern,
        name,
        parent,
        node,
        kind: "union",
        required,
        nullable: union.nullable,
        ...(discriminator ? { discriminator } : {}),
      });
      // List items' fields hang off the list's pattern, not "<list>_item".
      const base = name === "item" && parent !== null ? parent : pattern;
      for (const option of union.options) {
        const resolved = resolve(option, root);
        const own = new Set(resolved.required ?? []);
        for (const [child, childSchema] of Object.entries(resolved.properties ?? {})) {
          const childNode = resolve(childSchema, root);
          if (child === discriminator) {
            add({
              pattern: childPattern(base, child),
              name: child,
              parent: pattern,
              node: childNode,
              kind: "string",
              required: true,
              nullable: false,
              values: childNode.const === undefined ? [] : [String(childNode.const)],
            });
            continue;
          }
          visit(childSchema, childPattern(base, child), child, pattern, own.has(child), depth + 1);
        }
      }
      return;
    }
    visitNode(node, pattern, name, parent, required, false, depth);
  };

  const visitNode = (
    node: JsonSchema,
    pattern: string,
    name: string,
    parent: string | null,
    required: boolean,
    nullable: boolean,
    depth: number,
  ) => {
    const kind = kindOf(node);
    if (node.const !== undefined) return;
    if (kind === "array") {
      const itemSchema = resolve(
        (Array.isArray(node.items) ? node.items[0] : node.items) ?? {},
        root,
      );
      const itemUnion = unionOf(itemSchema, root);
      const itemKind = itemUnion && itemUnion.options.length > 1 ? "union" : kindOf(itemSchema);
      add({
        pattern,
        name,
        parent,
        node,
        kind,
        required,
        nullable,
        item: itemKind,
        ...(enumValues(itemSchema) ? { values: enumValues(itemSchema) } : {}),
      });
      if (itemKind === "object" || itemKind === "union")
        visit(itemSchema, childPattern(pattern, "item"), "item", pattern, true, depth + 1);
      return;
    }
    if (kind === "object") {
      add({ pattern, name, parent, node, kind, required, nullable });
      const own = new Set(node.required ?? []);
      // List items' fields hang off the list's pattern, not "<list>_item".
      const base = name === "item" && parent !== null ? parent : pattern;
      for (const [child, childSchema] of Object.entries(node.properties ?? {}))
        visit(childSchema, childPattern(base, child), child, pattern, own.has(child), depth + 1);
      return;
    }
    add({
      pattern,
      name,
      parent,
      node,
      kind,
      required,
      nullable,
      ...(enumValues(node) ? { values: enumValues(node) } : {}),
    });
  };

  visit(root, "", "", null, true, 0);
  return [...out.values()];
}
