import type { ListPage, ListWindow } from "./types";

const MAX_PAGE_SIZE = 100;

/** Lowercases and strips accents and apostrophes, so "turkiye" finds "Türkiye" and "coxs" finds "Cox’s". */
export function normalizeText(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[’'`]/g, "").toLowerCase().trim();
}

/** True when every word of the query appears somewhere in the fields; an empty query matches everything. */
export function matchesSearch(
  fields: readonly (string | undefined)[],
  query: string | undefined,
): boolean {
  const words = normalizeText(query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return true;
  const text = normalizeText(fields.filter(Boolean).join(" "));
  return words.every((word) => text.includes(word));
}

/** One "Load more" slice of a list. */
export function paginate<T>(
  items: readonly T[],
  window: ListWindow = {},
  defaultLimit = 12,
): ListPage<T> {
  const offset = Math.max(0, Math.floor(window.offset ?? 0));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(window.limit ?? defaultLimit)));
  const next = offset + limit;
  return {
    items: items.slice(offset, next),
    total: items.length,
    nextOffset: next < items.length ? next : null,
  };
}

/** Sorts a copy by the admin `order` field. */
export function byAdminOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/** True when `now` falls inside a schedule; a missing end means open-ended. */
export function isScheduledNow(
  schedule: { startsAt: string; endsAt?: string },
  now: Date,
): boolean {
  const time = now.getTime();
  if (Date.parse(schedule.startsAt) > time) return false;
  return schedule.endsAt === undefined || Date.parse(schedule.endsAt) > time;
}
