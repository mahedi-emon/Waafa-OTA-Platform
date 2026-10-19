"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { childPattern, patternOf } from "@/lib/admin/blueprints/paths";
import { defaultFor, resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { SchemaField } from "./SchemaField";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";
import { isWide } from "./wideWidgets";

type ObjectFieldProps = {
  schema: JsonSchema;
  path: Path;
  value: unknown;
  optional: boolean;
  /** A section's own group, a list item or the record itself: no frame, no title. */
  bare?: boolean;
};

/**
 * A group of fields in the blueprint's order. Every field shows (optional ones say so); an optional group that
 * isn't set yet shows an Add button in its place. Short fields sit two to a row from 768 px (ADMIN.md §5.4).
 */
function ObjectField({ schema, path, value, optional, bare = false }: ObjectFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  const required = new Set(schema.required ?? []);
  const base =
    path.length === 0
      ? ""
      : typeof path.at(-1) === "number"
        ? patternOf(path.slice(0, -1))
        : meta.pattern;
  const names = Object.keys(schema.properties ?? {});
  const order = editor.blueprint.fields[base]?.order ?? meta.field.order ?? [];
  const sorted = [
    ...order.filter((name) => names.includes(name)),
    ...names.filter((name) => !order.includes(name)),
  ];
  const visible = sorted.filter((name) => {
    const field = editor.blueprint.fields[childPattern(base, name)];
    return (
      !field?.hidden && resolve(schema.properties?.[name] ?? {}, editor.root).const === undefined
    );
  });

  if (!record && !bare) {
    // An optional group that isn't set yet: one button in its place.
    return (
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-mist-300 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-navy-900">
            {meta.label}
            {optional ? (
              <span className="ml-1.5 text-[12.5px] font-normal text-mist-500">
                {t("optional")}
              </span>
            ) : null}
          </p>
          {meta.help ? <p className="text-[13.5px] text-mist-600">{meta.help}</p> : null}
        </div>
        <Button
          type="button"
          variant="soft"
          size="sm"
          onClick={() => meta.change(defaultFor(schema, editor.root))}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t("set")}
        </Button>
      </div>
    );
  }

  const grid = (
    <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      {visible.map((name) => {
        const pattern = childPattern(base, name);
        const field = editor.blueprint.fields[pattern];
        const wide = isWide(field);
        return (
          <div key={name} className={cn("min-w-0", wide && "md:col-span-2")}>
            <SchemaField
              schema={schema.properties?.[name] ?? {}}
              path={[...path, name]}
              value={record?.[name]}
              optional={!required.has(name)}
            />
          </div>
        );
      })}
    </div>
  );

  if (bare) return grid;
  return (
    <fieldset className="min-w-0 rounded-2xl border border-mist-200 bg-mist-25 p-3 sm:p-4">
      <legend className="flex items-center gap-2 px-1 text-[14px] font-bold text-navy-900">
        {meta.label}
        {optional ? (
          <button
            type="button"
            aria-label={t("removeThing", { thing: meta.label })}
            onClick={() => meta.change(undefined)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-mist-500 hover:bg-mist-100 hover:text-danger-700 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </legend>
      {meta.help ? <p className="mb-3 px-1 text-[13.5px] text-mist-600">{meta.help}</p> : null}
      {grid}
    </fieldset>
  );
}

export { ObjectField };
