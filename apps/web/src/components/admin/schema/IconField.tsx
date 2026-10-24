"use client";

import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { IconPicker } from "./IconPicker";
import { useField } from "./useField";

type IconFieldProps = { path: Path; value: unknown; optional: boolean };

/** Picks one of the icons the site can draw, by look or by name (searchable). */
function IconField({ path, value, optional }: IconFieldProps) {
  const meta = useField(path);
  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <IconPicker
        id={meta.id}
        value={typeof value === "string" && value ? value : undefined}
        onChange={meta.change}
        describedBy={meta.describedBy}
        invalid={Boolean(meta.error)}
        onClose={meta.touch}
      />
    </FieldShell>
  );
}

export { IconField };
