"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { humanize } from "@/lib/admin/format";
import {
  fromLocalInput,
  isLongText,
  pathKey,
  toLocalInput,
  typeOf,
  type JsonSchema,
  type Path,
} from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useSchemaEditor } from "./useSchemaEditor";

type ScalarFieldProps = {
  schema: JsonSchema;
  path: Path;
  value: unknown;
  optional: boolean;
  nullable: boolean;
};

const fieldId = (path: Path) => `field-${pathKey(path).replace(/[^\w-]/g, "-") || "root"}`;

/** Text, long text, number, date, date and time, enum and on/off fields of the generic editor. */
function ScalarField({ schema, path, value, optional, nullable }: ScalarFieldProps) {
  const { errors, strings, change } = useSchemaEditor();
  const key = path.at(-1);
  const id = fieldId(path);
  const error = errors[pathKey(path)];
  const label = typeof key === "number" ? `${key + 1}` : humanize(String(key ?? ""));
  const type = typeOf(schema);
  const describedBy = error ? `${id}-error` : undefined;
  const canClear = (optional || nullable) && value !== undefined && value !== null;
  const clear = canClear ? (
    <button
      type="button"
      onClick={() => change(path, nullable && !optional ? null : undefined)}
      className="min-h-8 cursor-pointer rounded-full px-2.5 text-[12.5px] font-semibold text-mist-600 hover:bg-mist-100"
    >
      {strings.clear}
    </button>
  ) : null;
  const shell = (control: React.ReactNode) => (
    <FieldShell
      id={id}
      label={label}
      optional={optional ? strings.optional : undefined}
      hint={schema.description}
      error={error}
      actions={clear}
    >
      {control}
    </FieldShell>
  );

  if (type === "boolean") {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-mist-200 px-4">
        <label htmlFor={id} className="text-[14px] font-semibold text-navy-900">
          {label}
        </label>
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => change(path, checked)}
        />
      </div>
    );
  }

  if (schema.enum) {
    return shell(
      <select
        id={id}
        value={value === undefined || value === null ? "" : String(value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return change(path, optional ? undefined : nullable ? null : raw);
          const match = schema.enum?.find((option) => String(option) === raw);
          change(path, match ?? raw);
        }}
        className="h-12 w-full cursor-pointer rounded-xl border border-mist-300 bg-white px-3 text-[15px] focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <option value="">{strings.choose}</option>
        {schema.enum.map((option) => (
          <option key={String(option)} value={String(option)}>
            {String(option)}
          </option>
        ))}
      </select>,
    );
  }

  if (type === "number" || type === "integer") {
    return shell(
      <Input
        id={id}
        type="number"
        inputMode={type === "integer" ? "numeric" : "decimal"}
        step={type === "integer" ? 1 : "any"}
        value={typeof value === "number" ? value : ""}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return change(path, optional ? undefined : nullable ? null : 0);
          const parsed = Number(raw);
          change(path, Number.isFinite(parsed) ? parsed : raw);
        }}
        className="tabular-nums"
      />,
    );
  }

  if (schema.format === "date-time") {
    return shell(
      <Input
        id={id}
        type="datetime-local"
        value={toLocalInput(value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => {
          const next = fromLocalInput(event.target.value);
          change(path, next || (optional ? undefined : nullable ? null : ""));
        }}
      />,
    );
  }

  if (schema.format === "date") {
    return shell(
      <Input
        id={id}
        type="date"
        value={typeof value === "string" ? value.slice(0, 10) : ""}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) =>
          change(path, event.target.value || (optional ? undefined : nullable ? null : ""))
        }
      />,
    );
  }

  const text =
    typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
  const onText = (next: string) =>
    change(path, next === "" && optional ? undefined : next === "" && nullable ? null : next);

  if (isLongText(schema, key)) {
    return shell(
      <Textarea
        id={id}
        value={text}
        maxLength={schema.maxLength}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onText(event.target.value)}
        className="min-h-28"
      />,
    );
  }

  return shell(
    <Input
      id={id}
      type={schema.format === "uri" ? "url" : schema.format === "email" ? "email" : "text"}
      value={text}
      maxLength={schema.maxLength}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      onChange={(event) => onText(event.target.value)}
    />,
  );
}

export { ScalarField };
