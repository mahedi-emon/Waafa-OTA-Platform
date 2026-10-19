"use client";

import { useTranslations } from "next-intl";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type ReadOnlyFieldProps = { path: Path; value: unknown };

/** A value the system owns, shown in words (a template's audience, a booking mode that stays locked). */
function ReadOnlyField({ path, value }: ReadOnlyFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets");
  const label = (item: unknown) =>
    meta.field.choices?.find((choice) => choice.value === item)?.label ??
    (item === true ? t("on") : item === false ? t("off") : String(item));
  const words = Array.isArray(value)
    ? value.map(label).join(", ")
    : value === undefined || value === null || value === ""
      ? t("readOnly.empty")
      : label(value);

  return (
    <FieldShell id={meta.id} label={meta.label} {...(meta.help ? { help: meta.help } : {})} group>
      <p className="min-h-11 rounded-xl bg-mist-100 px-3.5 py-2.5 text-[15px] text-ink-900">
        {words}
      </p>
    </FieldShell>
  );
}

export { ReadOnlyField };
