import {
  CONTENT_MODEL,
  hasPublishWorkflow,
  nextContentStatus,
  type CollectionKey,
  type ContentAction,
} from "@waafa/shared";
import { problems } from "../common/problem";

type Data = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/** Lists whose records show a "published on" date on the site (blog posts, tour packages). */
function hasPublishedDate(key: CollectionKey): boolean {
  const shape = (CONTENT_MODEL[key].schema as { shape?: Record<string, unknown> }).shape;
  return Boolean(shape && Object.hasOwn(shape, "publishedAt"));
}

/** The calendar day in Asia/Dhaka of an ISO time. */
const dhakaDate = (iso: string) =>
  new Date(Date.parse(iso) + 6 * 3_600_000).toISOString().slice(0, 10);

/** Why a button can't apply, in plain words with the next step. */
const REFUSALS = {
  archived: "This record is archived: restore it first",
  live: "This record is live: unpublish it first, or save your changes with Update",
  past: "Pick a time in the future to schedule it",
  invalidDate: "Pick a date and time to schedule it",
} as const;

/**
 * The record with its workflow fields set from the editor's button (D0 R4, D216). A plain save keeps the stored
 * status and times, whatever the data says; Publish stamps since when the record is live, and a record going live
 * now shows today as its published date. Lists without drafts are returned as they are.
 */
export function withWorkflow(
  key: CollectionKey,
  record: unknown,
  stored: unknown,
  action: ContentAction | undefined,
  now: Date,
): { record: unknown; step: ContentAction["type"] | null } {
  if (!hasPublishWorkflow(key) || !record || typeof record !== "object") {
    return { record, step: null };
  }
  const current = (stored && typeof stored === "object" ? stored : {}) as Data;
  const button: ContentAction = action ?? { type: stored ? "update" : "saveDraft" };
  const move = nextContentStatus(
    {
      status: text(current.status),
      publishAt: text(current.publishAt),
      liveSince: text(current.liveSince),
    },
    button,
    now,
  );
  if (!move.ok) throw problems.conflict(REFUSALS[move.reason], move.reason);
  const { publishAt: _publishAt, liveSince: _liveSince, ...rest } = record as Data;
  const next: Data = { ...rest, ...move.next };
  if (move.next.status === "published" && current.status !== "published" && hasPublishedDate(key)) {
    next.publishedAt = dhakaDate(move.next.liveSince ?? now.toISOString());
  }
  return { record: next, step: button.type };
}
