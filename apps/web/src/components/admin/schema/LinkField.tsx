"use client";

import { useTranslations } from "next-intl";
import { patternOf } from "@/lib/admin/blueprints/paths";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { LinkPicker } from "./LinkPicker";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type LinkFieldProps = { path: Path; value: unknown; optional: boolean };

/**
 * A link's address in the editor (D0 R7): the link picker, with "opens in a new tab" set from where it goes when the
 * link has that flag (`external`, hidden from staff).
 */
function LinkField({ path, value, optional }: LinkFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.link");
  const href = typeof value === "string" ? value : "";
  const externalPath = [...path.slice(0, -1), "external"];
  const hasExternal = Boolean(editor.blueprint.fields[patternOf(externalPath)]);

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      actions={
        href && optional ? (
          <button
            type="button"
            onClick={() => {
              meta.change(undefined);
              if (hasExternal) editor.change(externalPath, false);
            }}
            className="relative min-h-8 cursor-pointer rounded-full px-2.5 text-[12.5px] font-semibold text-mist-600 after:absolute after:inset-x-0 after:-inset-y-1.5 hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {t("remove")}
          </button>
        ) : null
      }
    >
      <LinkPicker
        id={meta.id}
        value={href}
        onChange={(next, external) => {
          meta.change(next);
          if (hasExternal) editor.change(externalPath, external);
        }}
        describedBy={meta.describedBy}
        invalid={Boolean(meta.error)}
        onClose={meta.touch}
      />
    </FieldShell>
  );
}

export { LinkField };
