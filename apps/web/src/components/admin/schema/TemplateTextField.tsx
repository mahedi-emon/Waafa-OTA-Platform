"use client";

import { useRef, type RefObject } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Path } from "@/lib/admin/schema";
import { getAt } from "@/lib/admin/schema";
import { fillTemplate, insertAt, templateVariables } from "@/lib/admin/templateText";
import { FieldShell } from "./FieldShell";
import { TemplatePreview } from "./TemplatePreview";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type TemplateTextFieldProps = {
  path: Path;
  value: unknown;
  optional: boolean;
  /** The body: several lines, with the live preview of the whole message under it. */
  body?: boolean;
};

/**
 * A message template's subject or body (D0 R9): the words as staff type them, an Insert button for each detail the
 * message can carry (inserted where the cursor is, never typed by hand), and for the body a live preview of the
 * email or SMS with sample details filled in.
 */
function TemplateTextField({ path, value, optional, body = false }: TemplateTextFieldProps) {
  const meta = useField(path);
  const editor = useSchemaEditor();
  const t = useTranslations("Admin.editor.widgets.template");
  const box = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const text = typeof value === "string" ? value : "";
  const owner = path.slice(0, -1);
  const variables = templateVariables(getAt(editor.value, [...owner, "variables"]));
  const label = (name: string) =>
    t.has(`vars.${name}.label` as "vars.reference.label")
      ? t(`vars.${name}.label` as "vars.reference.label")
      : name.replaceAll("_", " ");
  const sample = (name: string) =>
    t.has(`vars.${name}.sample` as "vars.reference.sample")
      ? t(`vars.${name}.sample` as "vars.reference.sample")
      : label(name);

  const filled = fillTemplate(text, sample);

  const insert = (name: string) => {
    const element = box.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    const next = insertAt(text, `{{${name}}}`, start, end);
    meta.change(next.text);
    // Put the cursor after the inserted detail once React has drawn the new words.
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(next.cursor, next.cursor);
    });
  };

  const shared = {
    id: meta.id,
    value: text,
    "aria-describedby": [meta.describedBy, `${meta.id}-insert`].filter(Boolean).join(" "),
    "aria-invalid": meta.error ? true : undefined,
    onBlur: meta.touch,
    onChange: (event: { target: { value: string } }) => meta.change(event.target.value),
  } as const;

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <div className="flex flex-col gap-2.5">
        {body ? (
          <Textarea
            {...shared}
            ref={box as RefObject<HTMLTextAreaElement>}
            className="field-sizing-content min-h-36"
          />
        ) : (
          <Input {...shared} ref={box as RefObject<HTMLInputElement>} className="h-11" />
        )}
        {variables.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span id={`${meta.id}-insert`} className="text-[12.5px] font-medium text-mist-600">
              {t("insert")}
            </span>
            {variables.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => insert(name)}
                aria-label={t("insertLabel", { detail: label(name) })}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full border border-mist-200 bg-white px-3 text-[13px] font-medium text-navy-900 transition-colors duration-150 hover:border-electric-200 hover:bg-electric-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none motion-reduce:transition-none"
              >
                <Plus aria-hidden="true" className="size-3.5 text-brand-700" />
                {label(name)}
              </button>
            ))}
          </div>
        ) : null}
        {body ? (
          <TemplatePreview
            channel={String(getAt(editor.value, [...owner, "channel"]) ?? "email")}
            subject={fillTemplate(String(getAt(editor.value, [...owner, "subject"]) ?? ""), sample)}
            body={filled}
            words={{
              title: t("preview"),
              note: t("previewNote"),
              subject: t("subject"),
              from: t("from"),
              length: t("smsLength", { count: filled.length }),
            }}
          />
        ) : null}
      </div>
    </FieldShell>
  );
}

export { TemplateTextField };
