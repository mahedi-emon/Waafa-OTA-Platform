/*
 * Content status (D0 R4, ADMIN.md §8.1): packages, products, visa countries and guides, blog posts, flight routes,
 * pages and the like. Staff never pick a status; buttons move it and dates decide what the site shows. No zod here:
 * the admin's client code imports these rules (D202).
 */

export type ContentStatus = "draft" | "scheduled" | "published" | "archived";

/** What a button in the editor asks for. */
export type ContentAction =
  | { type: "saveDraft" }
  | { type: "publish" }
  | { type: "schedule"; at: string }
  | { type: "update" }
  | { type: "unpublish" }
  | { type: "archive" }
  | { type: "restore" };

/** The dates a record may carry that change what the site shows. */
export type ContentDates = {
  status?: string | undefined;
  /** When a scheduled record goes live. */
  publishAt?: string | null | undefined;
  /** When it went live (kept for "Live since"). */
  liveSince?: string | null | undefined;
  /** Banners, deals and announcements show only inside their window. */
  startsAt?: string | null | undefined;
  endsAt?: string | null | undefined;
};

/** The workflow fields a record stores. Only the API writes them, through `nextContentStatus`. */
export type ContentWorkflow = { status: ContentStatus; publishAt?: string; liveSince?: string };

export type ContentMove =
  | { ok: true; next: ContentWorkflow }
  | { ok: false; reason: "archived" | "live" | "past" | "invalidDate" };

const time = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : at;
};

const iso = (value: string | null | undefined): string | undefined => {
  const at = time(value);
  return at === null ? undefined : new Date(at).toISOString();
};

const asStatus = (value: string | undefined): ContentStatus =>
  value === "scheduled" || value === "published" || value === "archived" ? value : "draft";

/** The stored fields as they are, without a stale publish time or live-since stamp. */
function kept(current: ContentDates): ContentWorkflow {
  const status = asStatus(current.status);
  const publishAt = status === "scheduled" ? iso(current.publishAt) : undefined;
  const liveSince = status === "published" ? iso(current.liveSince) : undefined;
  return {
    status,
    ...(publishAt ? { publishAt } : {}),
    ...(liveSince ? { liveSince } : {}),
  };
}

/**
 * The workflow fields after a button, or why the button can't apply: an archived record is restored first, a live
 * one is unpublished rather than saved as a draft, and a schedule needs a time in the future. Update and a plain
 * save keep what is stored; Publish stamps the time it went live (a live record keeps its first stamp).
 */
export function nextContentStatus(
  current: ContentDates,
  action: ContentAction,
  now: Date = new Date(),
): ContentMove {
  const from = asStatus(current.status);
  switch (action.type) {
    case "update":
      return { ok: true, next: kept(current) };
    case "saveDraft":
      if (from === "archived") return { ok: false, reason: "archived" };
      if (from === "published") return { ok: false, reason: "live" };
      return { ok: true, next: { status: "draft" } };
    case "publish": {
      if (from === "archived") return { ok: false, reason: "archived" };
      const since = from === "published" ? iso(current.liveSince) : undefined;
      return { ok: true, next: { status: "published", liveSince: since ?? now.toISOString() } };
    }
    case "schedule": {
      if (from === "archived") return { ok: false, reason: "archived" };
      if (from === "published") return { ok: false, reason: "live" };
      const at = time(action.at);
      if (at === null) return { ok: false, reason: "invalidDate" };
      if (at <= now.getTime()) return { ok: false, reason: "past" };
      return { ok: true, next: { status: "scheduled", publishAt: new Date(at).toISOString() } };
    }
    case "unpublish":
      if (from === "archived") return { ok: false, reason: "archived" };
      return { ok: true, next: { status: "draft" } };
    case "archive":
      return { ok: true, next: { status: "archived" } };
    case "restore":
      return from === "archived"
        ? { ok: true, next: { status: "draft" } }
        : { ok: true, next: kept(current) };
  }
}

/** The chip a record shows, with the date its tooltip names. */
export type ContentChip =
  | { state: "draft" }
  | { state: "scheduled"; at: string }
  | { state: "live"; since?: string; until?: string }
  | { state: "expired"; at: string }
  | { state: "archived" };

/**
 * Draft, Scheduled, Live, Expired or Archived from the stored status and the dates (times are stored as ISO strings
 * with their offset, so plain timestamps compare correctly). A scheduled record whose time has come is Live even
 * before the minute job flips it, so the admin never says Scheduled for a time already past.
 */
export function contentChip(record: ContentDates, now: Date = new Date()): ContentChip {
  const status = asStatus(record.status);
  const at = now.getTime();
  if (status === "archived") return { state: "archived" };
  if (status === "draft") return { state: "draft" };
  const publishAt = time(record.publishAt);
  if (status === "scheduled") {
    if (publishAt === null) return { state: "draft" };
    if (publishAt > at) return { state: "scheduled", at: new Date(publishAt).toISOString() };
  }
  const startsAt = time(record.startsAt);
  if (startsAt !== null && startsAt > at)
    return { state: "scheduled", at: new Date(startsAt).toISOString() };
  const endsAt = time(record.endsAt);
  if (endsAt !== null && endsAt <= at)
    return { state: "expired", at: new Date(endsAt).toISOString() };
  const since = status === "scheduled" ? publishAt : (time(record.liveSince) ?? startsAt);
  return {
    state: "live",
    ...(since !== null ? { since: new Date(since).toISOString() } : {}),
    ...(endsAt !== null ? { until: new Date(endsAt).toISOString() } : {}),
  };
}

/** Whether the public site shows the record now (Live, nothing else). */
export function isLiveNow(record: ContentDates, now: Date = new Date()): boolean {
  return contentChip(record, now).state === "live";
}

/** A scheduled record whose time has come: the minute job publishes it, stamped with that time. */
export function isDue(record: ContentDates, now: Date = new Date()): boolean {
  const publishAt = time(record.publishAt);
  return (
    asStatus(record.status) === "scheduled" && publishAt !== null && publishAt <= now.getTime()
  );
}
