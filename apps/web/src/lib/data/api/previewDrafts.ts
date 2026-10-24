import { CONTENT_KEYS, hasPublishWorkflow } from "@waafa/shared";

const WAITING = new Set(["draft", "scheduled"]);

/**
 * The snapshot as the site will look once everything waiting is published (Preview of unpublished changes, D0 R7):
 * drafts and scheduled records of the collections with a publish workflow read as Live. Archived records stay hidden
 * and nothing else changes. The snapshot already carries every record; the public site normally filters to Live.
 */
export function previewDrafts(body: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...body };
  for (const key of CONTENT_KEYS) {
    const list = body[key];
    if (!hasPublishWorkflow(key) || !Array.isArray(list)) continue;
    next[key] = list.map((record: unknown) => {
      if (!record || typeof record !== "object") return record;
      const current = record as Record<string, unknown>;
      if (typeof current.status !== "string" || !WAITING.has(current.status)) return record;
      const live: Record<string, unknown> = { ...current, status: "published" };
      delete live.publishAt;
      return live;
    });
  }
  return next;
}
