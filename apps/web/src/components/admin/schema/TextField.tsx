"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { JsonSchema, Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type TextFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
  nullable: boolean;
  multiline?: boolean;
};

/** Counters help where a limit is short enough to matter (titles, summaries), not on long bodies. */
const COUNTER_LIMIT = 600;

/** One line or several lines of text, with a character counter when the field has a limit. */
function TextField({ path, node, value, optional, nullable, multiline = false }: TextFieldProps) {
  const meta = useField(path);
  const text =
    typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
  const max =
    typeof node.maxLength === "number" && node.maxLength <= COUNTER_LIMIT
      ? node.maxLength
      : undefined;
  const onText = (next: string) =>
    meta.change(next === "" && optional ? undefined : next === "" && nullable ? null : next);
  const shared = {
    id: meta.id,
    value: text,
    "aria-describedby": meta.describedBy,
    "aria-invalid": meta.error ? true : undefined,
    onBlur: meta.touch,
  } as const;

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      {...(max ? { counter: { count: text.length, max } } : {})}
    >
      {multiline ? (
        <Textarea
          {...shared}
          onChange={(event) => onText(event.target.value)}
          className="field-sizing-content min-h-28"
        />
      ) : (
        <Input
          {...shared}
          type={node.format === "email" ? "email" : node.format === "uri" ? "url" : "text"}
          inputMode={node.format === "email" ? "email" : node.format === "uri" ? "url" : undefined}
          onChange={(event) => onText(event.target.value)}
          className="h-11"
        />
      )}
    </FieldShell>
  );
}

export { TextField };
