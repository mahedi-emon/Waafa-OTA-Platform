"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type ColourFieldProps = { path: Path; value: unknown; optional: boolean };

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Colours already used by the record's other option values, offered as quick picks (no colours in code). */
function usedColours(record: unknown): string[] {
  const options = (record as { options?: Array<{ values?: Array<{ swatch?: unknown }> }> } | null)
    ?.options;
  const found = new Set<string>();
  for (const option of options ?? [])
    for (const item of option.values ?? [])
      if (typeof item.swatch === "string" && HEX.test(item.swatch))
        found.add(item.swatch.toLowerCase());
  return [...found];
}

/** A product colour: the system colour picker, the colour code, and the colours this product already uses. */
function ColourField({ path, value, optional }: ColourFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.colour");
  const colour = typeof value === "string" ? value : "";
  const valid = HEX.test(colour);
  const presets = usedColours(editor.value).filter((preset) => preset !== colour.toLowerCase());

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* An empty value shows the browser's default colour, so no colour is written in code. */}
        <input
          type="color"
          aria-label={t("custom")}
          value={valid ? colour : ""}
          onChange={(event) => meta.change(event.target.value)}
          className="size-11 cursor-pointer rounded-xl border border-mist-300 bg-white p-1"
        />
        <Input
          id={meta.id}
          value={colour}
          spellCheck={false}
          aria-describedby={meta.describedBy}
          aria-invalid={meta.error ? true : undefined}
          onChange={(event) =>
            meta.change(event.target.value === "" && optional ? undefined : event.target.value)
          }
          onBlur={meta.touch}
          className="h-11 w-36 font-mono uppercase"
        />
        {presets.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("presets")}>
            {presets.map((preset) => (
              <li key={preset}>
                <button
                  type="button"
                  aria-label={t("current", { value: preset.toUpperCase() })}
                  onClick={() => meta.change(preset)}
                  style={{ backgroundColor: preset }}
                  className="size-9 cursor-pointer rounded-full border border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FieldShell>
  );
}

export { ColourField };
