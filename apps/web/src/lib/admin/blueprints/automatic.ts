import { getAt, setAt, type Path } from "../schema";
import { pathsMatching } from "./paths";
import { freeId, slugify } from "./slug";
import type { ResolvedBlueprint } from "./types";

export type AutomaticContext = {
  /** The record is being created (not saved before). */
  isNew: boolean;
  now: Date;
  /** Ids already used in the list, so a new record's id is free. */
  takenIds?: readonly string[];
  /** A store category's level, for "levelFromParent". */
  levelOf?: (categoryId: string) => number | undefined;
};

const DHAKA_OFFSET = 6 * 60 * 60_000;

/** Today's date in Asia/Dhaka: "2026-10-19". */
export function todayInDhaka(now: Date): string {
  return new Date(now.getTime() + DHAKA_OFFSET).toISOString().slice(0, 10);
}

/** The current time in Asia/Dhaka as an ISO string with its offset: "2026-10-19T21:30:00+06:00". */
export function nowInDhaka(now: Date): string {
  return `${new Date(now.getTime() + DHAKA_OFFSET).toISOString().slice(0, 19)}+06:00`;
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

/** The words a record or list item is known by, to build an id from. */
function titleOf(record: unknown, preferred?: string): string {
  if (!record || typeof record !== "object") return "";
  const fields = record as Record<string, unknown>;
  for (const key of [
    preferred,
    "title",
    "name",
    "heading",
    "label",
    "question",
    "text",
    "value",
    "period",
    "sku",
  ]) {
    const candidate = key ? fields[key] : undefined;
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "";
}

/** "Page yield" → "pageYield" (attribute and option keys: a lowercase letter, then letters and digits). */
export function camelKey(label: string): string {
  const words = slugify(label, 40).split("-").filter(Boolean);
  const [first = "", ...rest] = words;
  const key = [first, ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1))].join("");
  return /^[a-z]/.test(key) ? key : `k${key}`;
}

/** Words in the record's texts (HTML tags left out), for "minutes to read". */
function wordCount(value: unknown): number {
  if (typeof value === "string")
    return value
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + wordCount(item), 0);
  if (value && typeof value === "object")
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["id", "slug", "src", "href", "url", "status", "category"].includes(key))
      .reduce((sum, [, item]) => sum + wordCount(item), 0);
  return 0;
}

/**
 * Fills in what staff never type (ids, keys, dates, day numbers, reading time, a category's level) just before a
 * save, following each field's rule. Values staff could see are never overwritten except by the "on save" rules.
 */
export function applyAutomatic(
  value: unknown,
  blueprint: ResolvedBlueprint,
  context: AutomaticContext,
): unknown {
  let next = value;
  const set = (path: Path, to: unknown) => {
    next = setAt(next, path, to);
  };

  for (const [pattern, field] of Object.entries(blueprint.fields)) {
    const rule = field.auto;
    if (!rule || rule === "keep" || rule === "listOrder") continue;
    for (const path of pathsMatching(next, pattern)) {
      const current = getAt(next, path);
      const parentPath = path.slice(0, -1);
      const owner = getAt(next, parentPath);
      switch (rule) {
        case "recordId":
          if (context.isNew && isEmpty(current))
            set(
              path,
              freeId(
                titleOf(owner, blueprint.titleField),
                new Set(context.takenIds ?? []),
                blueprint.key,
              ),
            );
          break;
        case "itemId":
        case "keyFromLabel": {
          if (!isEmpty(current)) break;
          const listPath = parentPath.slice(0, -1);
          const list = getAt(next, listPath);
          const field = path.at(-1) as string;
          const taken = new Set(
            (Array.isArray(list) ? list : [])
              .map((item) => (item as Record<string, unknown> | null)?.[field])
              .filter((id): id is string => typeof id === "string" && id !== ""),
          );
          if (rule === "itemId") {
            set(path, freeId(titleOf(owner), taken));
            break;
          }
          const base = camelKey(titleOf(owner, "label") || "option");
          let key = base;
          for (let n = 2; taken.has(key); n += 1) key = `${base}${n}`;
          set(path, key);
          break;
        }
        case "today":
          if (context.isNew || isEmpty(current)) set(path, todayInDhaka(context.now));
          break;
        case "todayOnSave":
          set(path, todayInDhaka(context.now));
          break;
        case "nowOnCreate":
          if (context.isNew || isEmpty(current)) set(path, nowInDhaka(context.now));
          break;
        case "nowOnSave":
          set(path, nowInDhaka(context.now));
          break;
        case "dayNumber": {
          const index = parentPath.at(-1);
          if (typeof index === "number") set(path, index + 1);
          break;
        }
        case "lowestPrice": {
          const prices = (owner as { prices?: unknown } | null)?.prices;
          const amounts = (Array.isArray(prices) ? prices : [])
            .map((item) => (item as { price?: unknown } | null)?.price)
            .filter((price): price is number => typeof price === "number" && price > 0);
          if (amounts.length > 0) set(path, Math.min(...amounts));
          break;
        }
        case "itineraryDays": {
          const days = (owner as { itinerary?: unknown } | null)?.itinerary;
          if (Array.isArray(days) && days.length > 0) set(path, days.length);
          break;
        }
        case "initialsFromName": {
          const words = String((owner as { name?: unknown } | null)?.name ?? "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          const letters = [words[0], words.length > 1 ? words.at(-1) : undefined]
            .map((word) => (word ? Array.from(word)[0]?.toUpperCase() : ""))
            .join("");
          if (letters) set(path, letters.slice(0, 3));
          break;
        }
        case "readingMinutes":
          set(path, Math.max(1, Math.round(wordCount(owner) / 200)));
          break;
        case "levelFromParent": {
          // Store categories go three deep: a top category is 1, its children 2, theirs 3.
          const parentId = (owner as { parentId?: unknown } | null)?.parentId;
          if (typeof parentId !== "string" || !parentId) {
            set(path, 1);
            break;
          }
          // Until the categories have loaded the parent's level is unknown: keep the stored one, never guess.
          const parentLevel = context.levelOf?.(parentId);
          if (typeof parentLevel === "number") set(path, parentLevel + 1);
          break;
        }
      }
    }
  }
  return next;
}
