import { discriminatorOf, resolve, typeOf, unionOf, type JsonSchema, type Path } from "../schema";
import { dottedOf, patternOf } from "./paths";
import type { ResolvedBlueprint } from "./types";

/** A plain-words problem with a field (Admin.editor.errors.<code>). */
export type FieldError = {
  code:
    | "required"
    | "tooLong"
    | "tooShort"
    | "pattern"
    | "slug"
    | "phone"
    | "email"
    | "url"
    | "code"
    | "min"
    | "max"
    | "minItems"
    | "maxItems"
    | "integer"
    | "invalid";
  values?: Record<string, string | number>;
};

/** Turns a schema pattern into the hint staff need (SlugSchema, E164 phones, airport and country codes). */
function patternError(pattern: string): FieldError {
  if (pattern.includes("[a-z0-9]+(?:-[a-z0-9]+)*")) return { code: "slug" };
  if (pattern.includes("\\+[1-9]")) return { code: "phone" };
  const capitals = /^\^\[A-Z\]\{(\d)\}\$$/.exec(pattern);
  if (capitals) return { code: "code", values: { example: capitals[1] === "2" ? "BD" : "DAC" } };
  return { code: "pattern" };
}

const isBlank = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

/** One value against its own schema node: no recursion into groups or lists. */
export function checkValue(node: JsonSchema, value: unknown, required: boolean): FieldError | null {
  if (isBlank(value)) {
    const mustFill = required && (typeof node.minLength !== "number" || node.minLength > 0);
    return mustFill && !(Array.isArray(node.type) && node.type.includes("null"))
      ? { code: "required" }
      : null;
  }
  const type = typeOf(node);
  if (type === "string" && typeof value === "string") {
    if (typeof node.minLength === "number" && value.length < node.minLength)
      return node.minLength <= 1
        ? { code: "required" }
        : { code: "tooShort", values: { min: node.minLength } };
    if (typeof node.maxLength === "number" && value.length > node.maxLength)
      return { code: "tooLong", values: { max: node.maxLength } };
    if (node.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return { code: "email" };
    if (node.format === "uri" && !/^https?:\/\/\S+$/.test(value)) return { code: "url" };
    if (node.pattern) {
      try {
        if (!new RegExp(node.pattern, "u").test(value)) return patternError(node.pattern);
      } catch {
        return null;
      }
    }
    if (node.enum && !node.enum.includes(value)) return { code: "invalid" };
  }
  if ((type === "number" || type === "integer") && typeof value === "number") {
    if (type === "integer" && !Number.isInteger(value)) return { code: "integer" };
    if (typeof node.minimum === "number" && value < node.minimum)
      return { code: "min", values: { min: node.minimum } };
    if (typeof node.exclusiveMinimum === "number" && value <= node.exclusiveMinimum)
      return { code: "min", values: { min: node.exclusiveMinimum + 1 } };
    if (typeof node.maximum === "number" && value > node.maximum)
      return { code: "max", values: { max: node.maximum } };
  }
  if (type === "array" && Array.isArray(value)) {
    if (typeof node.minItems === "number" && value.length < node.minItems)
      return { code: "minItems", values: { min: node.minItems } };
    if (typeof node.maxItems === "number" && value.length > node.maxItems)
      return { code: "maxItems", values: { max: node.maxItems } };
  }
  return null;
}

/**
 * Every problem in a record, keyed by dotted path ("prices.2.price"), using the schema's own rules. Fields the system
 * fills in are skipped. The API checks again on save; this only lets the form say it first, in plain words.
 */
export function validateRecord(
  root: JsonSchema,
  value: unknown,
  blueprint: ResolvedBlueprint,
): Map<string, FieldError> {
  const errors = new Map<string, FieldError>();
  const hidden = (path: Path) => Boolean(blueprint.fields[patternOf(path)]?.hidden);

  const visit = (
    schema: JsonSchema,
    current: unknown,
    path: Path,
    required: boolean,
    depth: number,
  ) => {
    if (depth > 14 || (path.length > 0 && hidden(path))) return;
    const node = resolve(schema, root);
    const union = unionOf(node, root);
    if (union) {
      if (current === null || current === undefined) {
        if (required && !union.nullable) errors.set(dottedOf(path), { code: "required" });
        return;
      }
      const discriminator = discriminatorOf(union.options);
      const option =
        union.options.length === 1
          ? union.options[0]
          : discriminator && current && typeof current === "object"
            ? union.options.find(
                (candidate) =>
                  candidate.properties?.[discriminator]?.const ===
                  (current as Record<string, unknown>)[discriminator],
              )
            : undefined;
      if (option) visit(option, current, path, required, depth + 1);
      return;
    }
    const problem = checkValue(node, current, required);
    if (problem) {
      errors.set(dottedOf(path), problem);
      return;
    }
    const type = typeOf(node);
    if (type === "object" && current && typeof current === "object" && !Array.isArray(current)) {
      const record = current as Record<string, unknown>;
      const own = new Set(node.required ?? []);
      for (const [name, child] of Object.entries(node.properties ?? {}))
        if (record[name] !== undefined || own.has(name))
          visit(child, record[name], [...path, name], own.has(name), depth + 1);
    }
    if (type === "array" && Array.isArray(current)) {
      const item = (Array.isArray(node.items) ? node.items[0] : node.items) ?? {};
      current.forEach((entry, index) => visit(item, entry, [...path, index], true, depth + 1));
    }
  };

  visit(root, value, [], true, 0);
  return errors;
}
