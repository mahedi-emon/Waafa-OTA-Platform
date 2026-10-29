"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { translatablePaths } from "@waafa/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSchemaEditor } from "../schema/useSchemaEditor";

/** "sections.0.heading" → "Sections 1 › Heading": the field as staff read it. */
function readablePath(path: string): string {
  return path
    .split(".")
    .map((part) =>
      /^\d+$/.test(part)
        ? String(Number(part) + 1)
        : part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (first) => first.toUpperCase()),
    )
    .join(" › ");
}

function textAt(record: unknown, path: string): string {
  let node: unknown = record;
  for (const key of path.split(".")) {
    if (!node || typeof node !== "object") return "";
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string" ? node : "";
}

/**
 * The record's Bangla text (issue 255): every field visitors read, with its English beside it. English stays required;
 * a Bangla field left empty shows the English on /bn pages. Shown only for lists whose records can carry Bangla.
 */
function EditorBangla() {
  const t = useTranslations("Admin.editor.bangla");
  const uid = useId();
  const { root, value, update } = useSchemaEditor();
  const properties = (root as { properties?: Record<string, unknown> }).properties;
  if (!properties || !("bn" in properties)) return null;
  const record = (value ?? {}) as Record<string, unknown>;
  const bn = (record.bn ?? {}) as Record<string, string>;
  const paths = translatablePaths(record);
  if (paths.length === 0) return null;
  const written = paths.filter((path) => bn[path]?.trim()).length;

  const set = (path: string, text: string) =>
    update(["bn"], (current) => {
      const next = { ...((current ?? {}) as Record<string, string>) };
      if (text.trim()) next[path] = text;
      else delete next[path];
      return Object.keys(next).length > 0 ? next : undefined;
    });

  return (
    <details
      id="section-bangla"
      className="group rounded-2xl border border-mist-200 bg-white p-4 open:pb-6 sm:p-6"
    >
      <summary className="min-h-11 cursor-pointer content-center font-display text-[16px] font-bold text-navy-900">
        {t("title")}{" "}
        <span className="font-sans text-[14px] font-medium text-mist-600 tabular-nums">
          {t("count", { written, total: paths.length })}
        </span>
      </summary>
      <p className="mt-1 text-[14px] text-mist-600">{t("lead")}</p>
      <div className="mt-4 flex flex-col gap-4">
        {paths.map((path) => {
          const english = textAt(record, path);
          const id = `${uid}-${path}`;
          const long = english.length > 80 || english.includes("\n");
          return (
            <div key={path} className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={id}>{readablePath(path)}</Label>
              <p id={`${id}-en`} className="line-clamp-3 text-[13px] text-mist-600" lang="en">
                {english}
              </p>
              {long ? (
                <Textarea
                  id={id}
                  lang="bn"
                  rows={3}
                  value={bn[path] ?? ""}
                  aria-describedby={`${id}-en`}
                  onChange={(event) => set(path, event.target.value)}
                />
              ) : (
                <Input
                  id={id}
                  lang="bn"
                  value={bn[path] ?? ""}
                  aria-describedby={`${id}-en`}
                  onChange={(event) => set(path, event.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

export { EditorBangla };
