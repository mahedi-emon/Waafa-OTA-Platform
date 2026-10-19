"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type RawJsonFieldProps = { path: Path; value: unknown; optional: boolean };

/**
 * Fallback for shapes the form can't draw, checked on every change. Blueprints give every field a widget, so staff
 * only meet this under Advanced (Super Admin).
 */
function RawJsonField({ path, value, optional }: RawJsonFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.json");
  const [text, setText] = useState(() =>
    value === undefined ? "" : JSON.stringify(value, null, 2),
  );
  const [invalid, setInvalid] = useState(false);

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      optional={optional}
      {...(invalid ? { error: t("invalid") } : meta.error ? { error: meta.error } : {})}
    >
      <Textarea
        id={meta.id}
        value={text}
        spellCheck={false}
        aria-invalid={invalid || meta.error ? true : undefined}
        onChange={(event) => {
          setText(event.target.value);
          if (event.target.value.trim() === "") {
            setInvalid(false);
            meta.change(optional ? undefined : null);
            return;
          }
          try {
            meta.change(JSON.parse(event.target.value));
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
