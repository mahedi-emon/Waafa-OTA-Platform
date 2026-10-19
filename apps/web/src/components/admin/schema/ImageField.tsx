"use client";

import Image from "next/image";
import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resolve, type JsonSchema, type Path } from "@/lib/admin/schema";
import { FieldShell } from "./FieldShell";
import { TextField } from "./TextField";
import { useField } from "./useField";
import { useSchemaEditor } from "./useSchemaEditor";

type ImageFieldProps = {
  path: Path;
  node: JsonSchema;
  value: unknown;
  optional: boolean;
  nullable: boolean;
};

type Photo = { src?: string; alt?: string; credit?: string; creditUrl?: string };

/**
 * One photo: a preview, its address, the description for people who can't see it, and the credit folded away.
 * Interim until R3 brings upload and the media library to this field; sizes are measured, never typed.
 */
function ImageField({ path, node, value, optional, nullable }: ImageFieldProps) {
  const editor = useSchemaEditor();
  const meta = useField(path);
  const t = useTranslations("Admin.editor.widgets.image");
  const tw = useTranslations("Admin.editor.widgets");
  const photo = value && typeof value === "object" ? (value as Photo) : null;
  const child = (name: string) => resolve(node.properties?.[name] ?? {}, editor.root);
  const required = new Set(node.required ?? []);
  const src = photo?.src?.trim() ?? "";
  const previewable = /^(https?:\/\/|\/)/.test(src);

  if (!photo) {
    return (
      <FieldShell
        id={meta.id}
        label={meta.label}
        {...(meta.help ? { help: meta.help } : {})}
        optional={optional}
        group
      >
        <Button
          id={meta.id}
          type="button"
          variant="soft"
          size="sm"
          className="self-start"
          onClick={() => meta.change({ src: "", alt: "" })}
        >
          <Plus aria-hidden="true" className="size-4" />
          {tw("set")}
        </Button>
      </FieldShell>
    );
  }

  return (
    <FieldShell
      id={meta.id}
      label={meta.label}
      {...(meta.help ? { help: meta.help } : {})}
      optional={optional}
      {...(meta.error ? { error: meta.error } : {})}
      group
      actions={
        optional || nullable ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => meta.change(optional ? undefined : null)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {tw("remove")}
          </Button>
        ) : null
      }
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-mist-200 bg-white p-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:p-4">
        <div className="relative aspect-[4/3] w-full max-w-[200px] overflow-hidden rounded-lg border border-mist-200 bg-mist-100 sm:w-40">
          {previewable ? (
            <Image
              src={src}
              alt={t("preview")}
              fill
              sizes="160px"
              unoptimized={/^https?:\/\//.test(src)}
              className="object-cover"
            />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-1 text-[12.5px] text-mist-500">
              <ImageIcon aria-hidden="true" className="size-6" />
              {t("empty")}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <TextField
            path={[...path, "src"]}
            node={child("src")}
            value={photo.src}
            optional={!required.has("src")}
            nullable={false}
          />
          <TextField
            path={[...path, "alt"]}
            node={child("alt")}
            value={photo.alt}
            optional={!required.has("alt")}
            nullable={false}
          />
          {node.properties?.credit ? (
            <details className="group rounded-lg border border-mist-200 px-3 py-2 open:pb-3">
              <summary className="min-h-9 cursor-pointer content-center text-[14px] font-semibold text-navy-900">
                {t("credit")}
              </summary>
              <div className="mt-2 flex flex-col gap-4">
                <TextField
                  path={[...path, "credit"]}
                  node={child("credit")}
                  value={photo.credit}
                  optional
                  nullable={false}
                />
                <TextField
                  path={[...path, "creditUrl"]}
                  node={child("creditUrl")}
                  value={photo.creditUrl}
                  optional
                  nullable={false}
                />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </FieldShell>
  );
}

export { ImageField };
