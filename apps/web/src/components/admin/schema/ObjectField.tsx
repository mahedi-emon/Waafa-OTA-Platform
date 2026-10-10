"use client";

import { Plus, X } from "lucide-react";
import { humanize } from "@/lib/admin/format";
import { defaultFor, resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { SchemaField } from "./SchemaField";
import { useSchemaEditor } from "./useSchemaEditor";

type ObjectFieldProps = {
  schema: JsonSchema;
  path: Path;
  value: unknown;
  optional: boolean;
  /** The record itself (top level) has no frame and no title. */
  bare?: boolean;
};

const IMAGE_KEYS = ["src", "url"];

/**
 * A group of fields (an object in the schema): required fields always shown, optional ones shown when set and added
 * with one press. Image objects show a small preview of their address.
 */
function ObjectField({ schema, path, value, optional, bare = false }: ObjectFieldProps) {
  const { root, strings, change } = useSchemaEditor();
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const required = new Set(schema.required ?? []);
  const entries = Object.entries(schema.properties ?? {});
  const shown = entries.filter(([key]) => required.has(key) || record[key] !== undefined);
  const addable = entries.filter(([key]) => !required.has(key) && record[key] === undefined);
  const key = path.at(-1);
  const preview = IMAGE_KEYS.map((name) => record[name]).find(
    (candidate): candidate is string =>
      typeof candidate === "string" && /^(https?:\/\/|\/)/.test(candidate),
  );

  const body = (
    <div className="flex flex-col gap-4">
      {preview ? (
        <div
          aria-hidden="true"
          className="h-32 w-48 rounded-xl border border-mist-200 bg-mist-100 bg-cover bg-center"
          style={{ backgroundImage: `url("${preview.replace(/"/g, "%22")}")` }}
        />
      ) : null}
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        {shown.map(([name, child]) => {
          const resolved = resolve(child, root);
          const wide =
            resolved.type === "object" ||
            resolved.type === "array" ||
            Boolean(resolved.anyOf ?? resolved.oneOf ?? resolved.properties) ||
            (typeof resolved.maxLength === "number" && resolved.maxLength > 200);
          return (
            <div key={name} className={wide ? "min-w-0 md:col-span-2" : "min-w-0"}>
              <SchemaField
                schema={child}
                path={[...path, name]}
                value={record[name]}
                optional={!required.has(name)}
              />
            </div>
          );
        })}
      </div>
      {addable.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {addable.map(([name, child]) => (
            <button
              key={name}
              type="button"
              onClick={() => change([...path, name], defaultFor(child, root))}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full border border-dashed border-mist-300 px-3 text-[13px] font-semibold text-brand-700 hover:border-electric-600"
            >
              <Plus aria-hidden="true" className="size-3.5" />
              {humanize(name)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (bare) return body;
  return (
    <fieldset className="min-w-0 rounded-2xl border border-mist-200 bg-mist-25 p-3 sm:p-4">
      <legend className="flex items-center gap-2 px-1 text-[14px] font-bold text-navy-900">
        {typeof key === "number" ? `${key + 1}` : humanize(String(key ?? ""))}
        {optional ? (
          <button
            type="button"
            aria-label={`${strings.removeItem} ${humanize(String(key ?? ""))}`}
            onClick={() => change(path, undefined)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-mist-500 hover:bg-mist-100 hover:text-danger-600"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </legend>
      {body}
    </fieldset>
  );
}

export { ObjectField };
