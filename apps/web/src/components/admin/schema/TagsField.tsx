"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { JsonSchema, Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";

type TagsFieldProps = {
  path: Path;
  /** The schema of one item: words or whole numbers. */
  item: JsonSchema;
  value: unknown;
  optional: boolean;
};

/** Short words or numbers as chips: type and press Enter or a comma; Backspace in the empty box removes the last. */
function TagsField({ path, item, value, optional }: TagsFieldProps) {
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.tags");
  const [text, setText] = useState("");
  const numeric = item.type === "integer" || item.type === "number";
  const tags = Array.isArray(value) ? value : [];

  const add = (raw: string) => {
    const words = raw
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    if (words.length === 0) return;
    const parsed = numeric
      ? words
          .map(Number)
          .filter(
            (number) =>
              Number.isFinite(number) && (item.type !== "integer" || Number.isInteger(number)),
          )
      : words;
    const next = [...tags];
    for (const word of parsed) if (!next.includes(word)) next.push(word);
    meta.change(next);
    setText("");
  };
  const remove = (index: number) => meta.change(tags.filter((_, position) => position !== index));

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
    >
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md border border-input bg-white px-2 py-1.5 shadow-xs focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/13">
        {tags.map((tag, index) => (
          <span
            key={`${String(tag)}-${index}`}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-mist-100 pr-1 pl-3 text-[14px] font-medium text-navy-900"
          >
            {String(tag)}
            <button
              type="button"
              aria-label={t("removeTag", { tag: String(tag) })}
              onClick={() => remove(index)}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-mist-600 hover:bg-mist-200 hover:text-danger-700 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={meta.id}
          value={text}
          inputMode={numeric ? "numeric" : undefined}
          placeholder={tags.length === 0 ? t("placeholder") : undefined}
          aria-describedby={meta.describedBy}
          aria-invalid={meta.error ? true : undefined}
          onChange={(event) => {
            const next = event.target.value;
            if (next.endsWith(",")) add(next);
            else setText(next);
          }}
          onKeyDown={(event) => {
            // Enter while an input method is composing picks the word, not a new tag.
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              add(text);
            } else if (event.key === "Backspace" && text === "" && tags.length > 0) {
              remove(tags.length - 1);
            }
          }}
          onBlur={() => {
            add(text);
            meta.touch();
          }}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-mist-500"
        />
      </div>
    </FieldShell>
  );
}

export { TagsField };
