"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SchemaField } from "../schema/SchemaField";
import { useSchemaEditor } from "../schema/useSchemaEditor";

type EditorAdvancedProps = { fields: string[] };

/**
 * For the Super Admin only, folded at the end (ADMIN.md §5.4): fields outside the blueprint and the whole record as
 * JSON. Saving checks the record exactly like the form does.
 */
function EditorAdvanced({ fields }: EditorAdvancedProps) {
  const editor = useSchemaEditor();
  const t = useTranslations("Admin.editor");
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);
  const record = (editor.value && typeof editor.value === "object" ? editor.value : {}) as Record<
    string,
    unknown
  >;
  const required = new Set(editor.root.required ?? []);

  return (
    <details
      className="group rounded-2xl border border-dashed border-mist-300 bg-white p-4 open:pb-6 sm:p-6"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) {
          setText(JSON.stringify(editor.value, null, 2));
          setInvalid(false);
        }
      }}
    >
      <summary className="min-h-11 cursor-pointer content-center font-display text-[16px] font-bold text-navy-900">
        {t("advanced.title")}
      </summary>
      <p className="mt-1 text-[14px] text-mist-600">{t("advanced.lead")}</p>
      {fields.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5">
          {fields.map((name) => (
            <SchemaField
              key={name}
              schema={editor.root.properties?.[name] ?? {}}
              path={[name]}
              value={record[name]}
              optional={!required.has(name)}
            />
          ))}
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-2">
        <label htmlFor="advanced-json" className="text-[14px] font-semibold text-navy-900">
          {t("widgets.json.title")}
        </label>
        <p id="advanced-json-help" className="text-[13.5px] text-mist-600">
          {t("widgets.json.hint")}
        </p>
        <Textarea
          id="advanced-json"
          value={text}
          spellCheck={false}
          aria-describedby="advanced-json-help"
          aria-invalid={invalid ? true : undefined}
          onChange={(event) => {
            setText(event.target.value);
            setInvalid(false);
          }}
          className="min-h-80 font-mono text-[13px]"
        />
        {invalid ? (
          <p role="alert" className="text-[13px] font-medium text-danger-700">
            {t("widgets.json.invalid")}
          </p>
        ) : null}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              try {
                editor.change([], JSON.parse(text));
              } catch {
                setInvalid(true);
              }
            }}
          >
            {t("widgets.json.apply")}
          </Button>
        </div>
      </div>
    </details>
  );
}

export { EditorAdvanced };
