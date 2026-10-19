"use client";

import { useTranslations } from "next-intl";
import { humanize } from "@/lib/admin/format";
import { dottedOf, leafOf, patternOf } from "@/lib/admin/blueprints/paths";
import type { ResolvedField } from "@/lib/admin/blueprints/types";
import type { Path } from "@/lib/admin/schema";
import { describedBy, fieldId } from "./fieldIds";
import { useSchemaEditor } from "./useSchemaEditor";

export type FieldMeta = {
  id: string;
  pattern: string;
  field: ResolvedField;
  label: string;
  help?: string;
  /** The problem in plain words, if any. */
  error?: string;
  describedBy?: string;
  change: (next: unknown) => void;
  touch: () => void;
};

/** Everything one field needs from the editor: its words, its error and how to change it. */
export function useField(path: Path): FieldMeta {
  const editor = useSchemaEditor();
  const t = useTranslations("Admin.editor.errors");
  const pattern = patternOf(path);
  const field = editor.blueprint.fields[pattern] ?? {
    label: humanize(leafOf(pattern) || editor.blueprint.key),
    widget: "json" as const,
  };
  const id = fieldId(path);
  const problem = editor.errors.get(dottedOf(path));
  const error = problem ? t(problem.code, problem.values ?? {}) : undefined;
  return {
    id,
    pattern,
    field,
    label: field.label,
    ...(field.help ? { help: field.help } : {}),
    ...(error ? { error } : {}),
    describedBy: describedBy(id, field.help, error),
    change: (next) => editor.change(path, next),
    touch: () => editor.touch(path),
  };
}
