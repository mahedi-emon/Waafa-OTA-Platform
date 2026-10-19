"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { publicPathOf } from "@/lib/admin/blueprints/display";
import { resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { ImageField } from "./ImageField";
import { SwitchField } from "./SwitchField";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type SeoFieldProps = { path: Path; node: JsonSchema; value: unknown };

type Seo = { title?: string; description?: string; image?: unknown; noIndex?: boolean };

/** What Google shows: about 60 characters of title and 155 of description. */
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

const firstText = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

/**
 * Search engine words with a live Google preview and counters, the photo used when the page is shared, and "Hide
 * from search engines" (ADMIN.md §6). Empty fields fall back to the page's own title and summary.
 */
function SeoField({ path, node, value }: SeoFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.seo");
  const seo = (value && typeof value === "object" ? value : {}) as Seo;
  const record = (editor.value && typeof editor.value === "object" ? editor.value : {}) as Record<
    string,
    unknown
  >;
  const titleFallback = firstText(record, [
    editor.blueprint.titleField ?? "title",
    "title",
    "name",
  ]);
  const descriptionFallback = firstText(record, [
    "summary",
    "excerpt",
    "intro",
    "lead",
    "description",
    "subtitle",
  ]);
  const title = seo.title?.trim() || titleFallback;
  const description = seo.description?.trim() || descriptionFallback;
  const host = editor.origin.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const where = publicPathOf(editor.blueprint, record) ?? "";
  const set = (name: keyof Seo, next: unknown) =>
    editor.change(path, { ...seo, [name]: next === "" ? undefined : next });
  const child = (name: string) => resolve(node.properties?.[name] ?? {}, editor.root);
  const titleId = `${meta.id}-title`;
  const descriptionId = `${meta.id}-description`;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <figure className="rounded-xl border border-mist-200 bg-white p-4">
        <figcaption className="mb-2 text-[12px] font-semibold tracking-wide text-mist-500 uppercase">
          {t("preview")}
        </figcaption>
        <p className="truncate text-[13px] text-mist-600">
          {host}
          {where}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[18px] leading-snug text-brand-700">
          {title || "…"}
        </p>
        <p className="text-ink-700 mt-1 line-clamp-2 text-[14px] leading-relaxed">
          {description || "…"}
        </p>
      </figure>

      <FieldShell
        id={titleId}
        label={t("title")}
        help={t("titleHint")}
        optional
        counter={{ count: (seo.title ?? "").length, max: TITLE_LIMIT, soft: true }}
      >
        <Input
          id={titleId}
          value={seo.title ?? ""}
          maxLength={child("title").maxLength}
          placeholder={titleFallback}
          aria-describedby={`${titleId}-help`}
          onChange={(event) => set("title", event.target.value)}
          className="h-11"
        />
      </FieldShell>

      <FieldShell
        id={descriptionId}
        label={t("description")}
        help={t("descriptionHint")}
        optional
        counter={{ count: (seo.description ?? "").length, max: DESCRIPTION_LIMIT, soft: true }}
      >
        <Textarea
          id={descriptionId}
          value={seo.description ?? ""}
          maxLength={child("description").maxLength}
          placeholder={descriptionFallback}
          aria-describedby={`${descriptionId}-help`}
          onChange={(event) => set("description", event.target.value)}
          className="min-h-24"
        />
      </FieldShell>

      {node.properties?.image ? (
        <ImageField
          path={[...path, "image"]}
          node={child("image")}
          value={seo.image}
          optional
          nullable={false}
        />
      ) : null}
      {node.properties?.noIndex ? (
        <SwitchField path={[...path, "noIndex"]} value={seo.noIndex} />
      ) : null}
    </div>
  );
}

export { SeoField };
