import { z } from "zod";

/*
 * Bilingual content (FR-GLB-07, issue 255). English stays the required text of every record; Bangla is optional and
 * lives beside it as `bn`: a flat map from the English field's path ("title", "sections.0.heading") to its Bangla text.
 * The site shows the Bangla text on /bn pages where it exists and the English text everywhere else.
 */

/** A field path inside a record: keys and list positions joined by dots. */
const BanglaPathSchema = z.string().regex(/^[a-zA-Z][\w]*(\.(\d+|[a-zA-Z][\w]*))*$/);

export const BanglaTextSchema = z
  .record(BanglaPathSchema, z.string().trim().max(20_000))
  .optional();
export type BanglaText = z.infer<typeof BanglaTextSchema>;

/**
 * The field names whose words visitors read. Links, slugs, ids, codes, dates, prices and image addresses never change
 * with the language, so only these are offered for Bangla.
 */
export const TRANSLATABLE_KEYS = new Set([
  "title",
  "name",
  "subtitle",
  "summary",
  "excerpt",
  "intro",
  "heading",
  "body",
  "description",
  "question",
  "answer",
  "label",
  "text",
  "caption",
  "alt",
  "tagline",
  "eyebrow",
  "headline",
  "note",
  "highlights",
  "inclusions",
  "exclusions",
  "itinerary",
  "requirements",
  "role",
  "bio",
  "message",
  "ctaLabel",
  "buttonLabel",
  "metaTitle",
  "metaDescription",
  "duration",
  "processingTime",
  "validity",
]);

/** Keys whose subtree is never translated (ids, links, media, money, dates). */
const SKIPPED_KEYS = new Set(["id", "slug", "href", "url", "src", "bn", "status", "sample"]);

/** The paths of a record's visitor-facing text, in reading order. */
export function translatablePaths(record: unknown): string[] {
  const paths: string[] = [];
  const walk = (node: unknown, path: string[], inText: boolean) => {
    if (typeof node === "string") {
      if (inText && node.trim() && !/^(https?:|\/)/.test(node)) paths.push(path.join("."));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, [...path, String(index)], inText));
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (SKIPPED_KEYS.has(key)) continue;
        // Only a text field itself, or a list of texts under it; objects inside name their own text fields.
        walk(value, [...path, key], TRANSLATABLE_KEYS.has(key));
      }
    }
  };
  walk(record, [], false);
  return paths;
}

/** True when a record has visitor-facing text and at least one piece of it has no Bangla yet. */
export function banglaMissing(record: unknown): boolean {
  const bn = (record as { bn?: Record<string, string> } | null)?.bn ?? {};
  return translatablePaths(record).some((path) => !bn[path]?.trim());
}

function setAt(target: unknown, path: string[], value: string): void {
  let node = target as Record<string, unknown>;
  for (const key of path.slice(0, -1)) {
    const next = node?.[key];
    if (!next || typeof next !== "object") return;
    node = next as Record<string, unknown>;
  }
  const last = path.at(-1);
  if (last !== undefined && node && typeof node[last] === "string") node[last] = value;
}

/**
 * A copy of any data (a record, a list, a page of results) with each record's Bangla text in place of its English,
 * where Bangla exists. Records without `bn` come back as they are.
 */
export function withBangla<T>(data: T): T {
  if (Array.isArray(data)) return data.map((item) => withBangla(item)) as T;
  if (!data || typeof data !== "object" || data instanceof Date) return data;
  const source = data as Record<string, unknown>;
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source))
    copy[key] = key === "bn" ? value : withBangla(value);
  const bn = source.bn;
  if (bn && typeof bn === "object") {
    for (const [path, text] of Object.entries(bn as Record<string, unknown>))
      if (typeof text === "string" && text.trim()) setAt(copy, path.split("."), text);
  }
  return copy as T;
}
