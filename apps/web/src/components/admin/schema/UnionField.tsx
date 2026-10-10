"use client";

import { humanize } from "@/lib/admin/format";
import {
  defaultFor,
  discriminatorOf,
  pathKey,
  type JsonSchema,
  type Path,
} from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { ObjectField } from "./ObjectField";
import { RawJsonField } from "./RawJsonField";
import { SchemaField } from "./SchemaField";
import { useSchemaEditor } from "./useSchemaEditor";

type UnionFieldProps = {
  options: JsonSchema[];
  nullable: boolean;
  path: Path;
  value: unknown;
  optional: boolean;
};

/**
 * One of several shapes (a discriminated union such as a payment method or a link kind): pick the kind, then fill its
 * fields. A single shape that may be empty is drawn as that shape; anything else falls back to JSON.
 */
function UnionField({ options, nullable, path, value, optional }: UnionFieldProps) {
  const { root, strings, change, errors } = useSchemaEditor();
  if (options.length === 1 && options[0]) {
    if (value === null || value === undefined) {
      return (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-dashed border-mist-300 px-4">
          <span className="text-[14px] font-semibold text-navy-900">
            {humanize(String(path.at(-1) ?? ""))}
          </span>
          <button
            type="button"
            onClick={() => change(path, defaultFor(options[0] as JsonSchema, root))}
            className="min-h-9 cursor-pointer rounded-full px-3 text-[13px] font-semibold text-brand-700 hover:bg-electric-50"
          >
            {strings.setValue}
          </button>
        </div>
      );
    }
    return (
      <SchemaField schema={options[0]} path={path} value={value} optional={optional || nullable} />
    );
  }

  const discriminator = discriminatorOf(options);
  if (!discriminator) return <RawJsonField path={path} value={value} optional={optional} />;

  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  const kind = record?.[discriminator];
  const active = options.find((option) => option.properties?.[discriminator]?.const === kind);
  const id = `field-${pathKey(path).replace(/[^\w-]/g, "-")}-kind`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4">
      <FieldShell
        id={id}
        label={`${humanize(String(path.at(-1) ?? ""))} · ${strings.variant}`}
        error={errors[pathKey(path)]}
      >
        <select
          id={id}
          value={typeof kind === "string" ? kind : ""}
          onChange={(event) => {
            const next = options.find(
              (option) => option.properties?.[discriminator]?.const === event.target.value,
            );
            change(path, next ? defaultFor(next, root) : nullable ? null : undefined);
          }}
          className="h-12 w-full cursor-pointer rounded-xl border border-mist-300 bg-white px-3 text-[15px]"
        >
          {nullable || optional || !active ? <option value="">{strings.choose}</option> : null}
          {options.map((option) => {
            const optionKind = String(option.properties?.[discriminator]?.const ?? "");
            return (
              <option key={optionKind} value={optionKind}>
                {optionKind}
              </option>
            );
          })}
        </select>
      </FieldShell>
      {active ? (
        <ObjectField schema={active} path={path} value={value} optional={false} bare />
      ) : null}
    </div>
  );
}

export { UnionField };
