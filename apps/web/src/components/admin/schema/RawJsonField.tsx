"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { humanize } from "@/lib/admin/format";
import { pathKey, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useSchemaEditor } from "./useSchemaEditor";

type RawJsonFieldProps = { path: Path; value: unknown; optional: boolean };

/** Fallback for shapes the form can't draw (free-form records, mixed unions): JSON, checked on every change. */
function RawJsonField({ path, value, optional }: RawJsonFieldProps) {
  const { errors, strings, change } = useSchemaEditor();
  const [text, setText] = useState(() =>
    value === undefined ? "" : JSON.stringify(value, null, 2),
  );
  const [invalid, setInvalid] = useState(false);
  const key = path.at(-1);
  const id = `field-${pathKey(path).replace(/[^\w-]/g, "-") || "root"}`;

  return (
    <FieldShell
      id={id}
      label={typeof key === "number" ? String(key + 1) : humanize(String(key ?? ""))}
      optional={optional ? strings.optional : undefined}
      error={invalid ? strings.jsonInvalid : errors[pathKey(path)]}
    >
      <Textarea
        id={id}
        value={text}
        spellCheck={false}
        onChange={(event) => {
          setText(event.target.value);
          if (event.target.value.trim() === "") {
            setInvalid(false);
            change(path, optional ? undefined : null);
            return;
          }
          try {
            change(path, JSON.parse(event.target.value));
            setInvalid(false);
          } catch {
            setInvalid(true);
          }
        }}
        className="min-h-32 font-mono text-[13px]"
      />
    </FieldShell>
  );
}

export { RawJsonField };
