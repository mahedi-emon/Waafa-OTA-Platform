"use client";

import { useState } from "react";
import { Link2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/admin/blueprints/slug";
import type { Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type SlugFieldProps = { path: Path; value: unknown };

/**
 * The record's web address, made from its title. Staff see the full address; "Edit link" opens the last part for
 * editing. Changing the link of a live record warns that old links stop working (redirects arrive with R4).
 */
function SlugField({ path, value }: SlugFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.slug");
  const [editing, setEditing] = useState(false);
  const slug = typeof value === "string" ? value : "";
  const host = editor.origin.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const prefix = meta.field.prefix ?? "/";
  const follows = editor.slugFollows(meta.pattern);

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      help={follows ? t("follows") : meta.help}
      {...(meta.error ? { error: meta.error } : {})}
      group={!editing}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl bg-mist-100 px-3.5 py-2.5">
          <Link2 aria-hidden="true" className="size-4 shrink-0 text-mist-500" />
          <p className="min-w-0 flex-1 text-[14.5px] break-all text-ink-900">
            <span className="text-mist-600">
              {host}
              {prefix}
            </span>
            <span className="font-semibold">{slug || "…"}</span>
          </p>
          {editing ? null : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              {t("edit")}
            </Button>
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              id={meta.id}
              value={slug}
              autoFocus
              spellCheck={false}
              aria-describedby={meta.describedBy}
              aria-invalid={meta.error ? true : undefined}
              onChange={(event) =>
                meta.change(event.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
              onBlur={() => {
                const clean = slugify(slug, 120);
                if (clean !== slug) meta.change(clean);
                meta.touch();
              }}
              className="h-11 font-medium"
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
              {t("done")}
            </Button>
          </div>
        ) : null}
        {editing && editor.live ? (
          <p className="flex items-start gap-2 text-[13.5px] text-warning-800">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t("liveWarning")}
          </p>
        ) : null}
      </div>
    </FieldShell>
  );
}

export { SlugField };
