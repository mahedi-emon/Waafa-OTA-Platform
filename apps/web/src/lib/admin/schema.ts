/*
 * JSON Schema helpers for the generic content editor (D138). The server turns each CONTENT_MODEL zod schema into
 * JSON Schema (zod's toJSONSchema, input side); the editor renders a form from it and the API validates on save.
 */

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema | JsonSchema[];
  prefixItems?: JsonSchema[];
  enum?: unknown[];
  const?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  minItems?: number;
  maxItems?: number;
  default?: unknown;
  description?: string;
  additionalProperties?: boolean | JsonSchema;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
};

export type Path = Array<string | number>;

/** Follows a local $ref ("#/$defs/Image") against the root schema; other schemas pass through. */
export function resolve(schema: JsonSchema, root: JsonSchema): JsonSchema {
  let current = schema;
  for (let depth = 0; current.$ref && depth < 20; depth += 1) {
    const match = /^#\/(\$defs|definitions)\/(.+)$/.exec(current.$ref);
    const defs = match?.[1] === "definitions" ? root.definitions : root.$defs;
    const target = match ? defs?.[decodeURIComponent(match[2] ?? "")] : undefined;
    if (!target) break;
    const { $ref: _ref, ...rest } = current;
    current = { ...target, ...rest };
  }
  if (current.allOf && current.allOf.length === 1 && current.allOf[0]) {
    const { allOf, ...rest } = current;
    current = { ...resolve(allOf[0] as JsonSchema, root), ...rest };
  }
  return current;
}

export function typeOf(schema: JsonSchema): string | undefined {
  if (Array.isArray(schema.type)) return schema.type.find((item) => item !== "null");
  if (schema.type) return schema.type;
  if (schema.properties) return "object";
  if (schema.enum) return typeof schema.enum[0] === "number" ? "number" : "string";
  if (schema.const !== undefined) return typeof schema.const;
  return undefined;
}

/** The options of a union (anyOf / oneOf), and whether null is one of them. */
export function unionOf(
  schema: JsonSchema,
  root: JsonSchema,
): { options: JsonSchema[]; nullable: boolean } | null {
  const raw = schema.anyOf ?? schema.oneOf;
  if (!raw) return null;
  const resolved = raw.map((option) => resolve(option, root));
  const nullable = resolved.some((option) => option.type === "null");
  return { options: resolved.filter((option) => option.type !== "null"), nullable };
}

/** True when null is allowed: a type list with null, or a union with a null option. */
export function isNullable(schema: JsonSchema, root: JsonSchema): boolean {
  if (Array.isArray(schema.type) && schema.type.includes("null")) return true;
  return unionOf(schema, root)?.nullable ?? false;
}

/** For a union of objects, the property whose `const` tells the options apart (e.g. "kind" or "method"). */
export function discriminatorOf(options: JsonSchema[]): string | null {
  const first = options[0]?.properties;
  if (!first || options.length < 2) return null;
  for (const key of Object.keys(first)) {
    const values = options.map((option) => option.properties?.[key]?.const);
    if (
      values.every((value) => typeof value === "string") &&
      new Set(values).size === options.length
    )
      return key;
  }
  return null;
}

/** A fresh value for a new item or a newly set field: defaults first, then the simplest valid shape. */
export function defaultFor(schema: JsonSchema, root: JsonSchema, depth = 0): unknown {
  const node = resolve(schema, root);
  if (node.default !== undefined) return structuredClone(node.default);
  if (node.const !== undefined) return node.const;
  if (depth > 12) return null;
  const union = unionOf(node, root);
  if (union) {
    if (union.nullable) return null;
    const first = union.options[0];
    return first ? defaultFor(first, root, depth + 1) : null;
  }
  if (node.enum && node.enum.length > 0) return node.enum[0];
  switch (typeOf(node)) {
    case "object": {
      const value: Record<string, unknown> = {};
      for (const key of node.required ?? []) {
        const child = node.properties?.[key];
        if (child) value[key] = defaultFor(child, root, depth + 1);
      }
      return value;
    }
    case "array":
      return [];
    case "string":
      return "";
    case "number":
    case "integer":
      return typeof node.minimum === "number" ? node.minimum : 0;
    case "boolean":
      return false;
    default:
      return null;
  }
}

export function getAt(value: unknown, path: Path): unknown {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

/** Immutable set; `undefined` removes an object key. */
export function setAt(value: unknown, path: Path, next: unknown): unknown {
  if (path.length === 0) return next;
  const [head, ...rest] = path as [string | number, ...Path];
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[head as number] = setAt(copy[head as number], rest, next);
    return copy;
  }
  const base = value && typeof value === "object" ? { ...(value as Record<string, unknown>) } : {};
  const child = setAt(base[head as string], rest, next);
  if (child === undefined) delete base[head as string];
  else base[head as string] = child;
  return base;
}

export function pathKey(path: Path): string {
  return path.map(String).join(".");
}

/** A one-line title for an item in a list (its name, title, label or first short text). */
export function summaryOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value).slice(0, 80);
  const record = value as Record<string, unknown>;
  for (const key of [
    "title",
    "name",
    "label",
    "question",
    "heading",
    "text",
    "code",
    "key",
    "id",
    "slug",
  ]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.slice(0, 80);
  }
  const first = Object.values(record).find((item) => typeof item === "string" && item.trim());
  return typeof first === "string" ? first.slice(0, 80) : "";
}

const LONG_TEXT_KEYS =
  /^(body|description|answer|content|html|text|bio|about|lead|notes?|summary|intro|excerpt|message|instructions|terms|policy|details)$/i;

/** Rich text (HTML) fields get the rich text editor (issue 116). */
export function isRichText(schema: JsonSchema): boolean {
  return schema.format === "html";
}

/** Long texts get a textarea: a known long field or a long maximum length. */
export function isLongText(schema: JsonSchema, key: string | number | undefined): boolean {
  if (typeof schema.maxLength === "number") return schema.maxLength > 200;
  return typeof key === "string" && LONG_TEXT_KEYS.test(key);
}

/** "2026-10-11T19:18:00+06:00" ↔ the value of a datetime-local input, in Asia/Dhaka. */
export function toLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const dhaka = new Date(date.getTime() + 6 * 60 * 60_000);
  return dhaka.toISOString().slice(0, 16);
}

export function fromLocalInput(value: string): string {
  return value ? `${value}:00+06:00` : "";
}
