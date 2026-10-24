import { CONTENT_KEYS, hasPublishWorkflow } from "@waafa/shared";

const WAITING = new Set(["draft", "scheduled"]);
/** Lists shown by their dates (a start and an optional end): a start still to come is a scheduled change. */
const DATED = ["banners", "announcements"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

/**
 * The snapshot as the site will look once everything waiting goes live (Preview of unpublished changes, D0 R7):
 * drafts and scheduled records of the collections with a publish workflow read as Live, and banners and
 * announcements whose start is still to come start now. Archived and switched-off records stay hidden, ended ones
 * stay ended, and nothing else changes. The snapshot already carries every record; the public site filters.
 */
export function previewDrafts(
  body: Record<string, unknown>,
  now: Date = new Date(),
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...body };
  for (const key of CONTENT_KEYS) {
    const list = body[key];
    if (!hasPublishWorkflow(key) || !Array.isArray(list)) continue;
    next[key] = list.map((record: unknown) => {
      const current = asRecord(record);
      if (!current || typeof current.status !== "string" || !WAITING.has(current.status)) {
        return record;
      }
      const live: Record<string, unknown> = { ...current, status: "published" };
      delete live.publishAt;
      return live;
    });
  }
  const startsNow = now.toISOString();
  for (const key of DATED) {
    const list = next[key];
    if (!Array.isArray(list)) continue;
    next[key] = list.map((record: unknown) => {
      const current = asRecord(record);
      const start = typeof current?.startsAt === "string" ? Date.parse(current.startsAt) : NaN;
      return current && start > now.getTime() ? { ...current, startsAt: startsNow } : record;
    });
  }
  return next;
}
