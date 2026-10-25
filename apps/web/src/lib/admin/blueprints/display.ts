import { contentChip } from "@waafa/shared/workflow/content";
import { windowStatus } from "@waafa/shared/workflow/derived";
import { getAt } from "../schema";
import { pathFromDotted } from "./paths";
import type { ResolvedBlueprint } from "./types";

type RecordLike = Record<string, unknown>;

const asRecord = (value: unknown): RecordLike =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : {};

/** Words for a value in a heading: an enum's label, a number, or the text itself. */
function wordsFor(blueprint: ResolvedBlueprint, pattern: string, value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return "";
  return (
    blueprint.fields[pattern]?.choices?.find((choice) => choice.value === value)?.label ?? value
  );
}

/**
 * Where the record shows on the site ("/tour-packages/bali-5-days"), from the blueprint's address. Null when the
 * record has no page of its own or a token is still empty.
 */
export function publicPathOf(blueprint: ResolvedBlueprint, value: unknown): string | null {
  const record = asRecord(value);
  const template =
    typeof blueprint.url === "string"
      ? blueprint.url
      : blueprint.url && blueprint.idField
        ? blueprint.url[String(record[blueprint.idField] ?? "")]
        : undefined;
  if (!template) return null;
  let missing = false;
  const path = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const part = record[name];
    if (typeof part !== "string" || !part) missing = true;
    return encodeURIComponent(String(part ?? ""));
  });
  return missing ? null : path;
}

/** The editor's heading: the blueprint's heading words ("Dhaka → Dubai · Emirates"), else the record's title. */
export function headingOf(blueprint: ResolvedBlueprint, value: unknown): string {
  const record = asRecord(value);
  if (blueprint.heading) {
    const text = blueprint.heading
      .replace(/\{(\w+)\}/g, (_, pattern: string) =>
        wordsFor(blueprint, pattern, getAt(record, pathFromDotted(pattern.replace(/_/g, ".")))),
      )
      .replace(/\s*·\s*$/, "")
      .replace(/^\s*·\s*/, "")
      .trim();
    if (text.replace(/[→·\s]/g, "")) return text;
  }
  const title = blueprint.titleField ? record[blueprint.titleField] : undefined;
  if (typeof title === "string" && title.trim())
    return wordsFor(blueprint, blueprint.titleField ?? "", title);
  return "";
}

export type RecordStatus = {
  /** Which StatusChip to show; "direct" is content without drafts, live as soon as it is saved. */
  state:
    | "new"
    | "draft"
    | "scheduled"
    | "live"
    | "archived"
    | "shown"
    | "hidden"
    | "direct"
    /** Switched on, with a start date still ahead (banners, deals, announcements; D0 R10). */
    | "startsLater"
    /** Switched on, but its end date has passed. */
    | "ended";
  /** When a scheduled record goes live, or since when a live one is (D0 R4). */
  at?: string;
};

/**
 * The record's status for the side panel: its workflow status, else whether it shows on the site, else "direct"
 * (settings and lists without drafts or a show switch, which change the site with every save).
 */
export function statusOf(
  blueprint: ResolvedBlueprint,
  value: unknown,
  isNew: boolean,
  now: Date = new Date(),
): RecordStatus {
  if (isNew) return { state: "new" };
  const record = asRecord(value);
  if (blueprint.workflow) {
    const chip = contentChip(
      {
        status: typeof record.status === "string" ? record.status : undefined,
        publishAt: typeof record.publishAt === "string" ? record.publishAt : undefined,
        liveSince: typeof record.liveSince === "string" ? record.liveSince : undefined,
      },
      now,
    );
    if (chip.state === "scheduled") return { state: "scheduled", at: chip.at };
    if (chip.state === "live")
      return chip.since ? { state: "live", at: chip.since } : { state: "live" };
    if (chip.state === "archived") return { state: "archived" };
    return { state: "draft" };
  }
  const switchName = blueprint.visibility.find((name) => name === "enabled" || name === "visible");
  if (switchName) {
    if (record[switchName] === false) return { state: "hidden" };
    // Records with a start and end (banners, deals, announcements) say when they show, from their dates.
    if (blueprint.visibility.includes("startsAt") || blueprint.visibility.includes("endsAt")) {
      const startsAt = typeof record.startsAt === "string" ? record.startsAt : undefined;
      const endsAt = typeof record.endsAt === "string" ? record.endsAt : undefined;
      const window = windowStatus({ startsAt, endsAt }, now);
      if (window === "scheduled" && startsAt) return { state: "startsLater", at: startsAt };
      if (window === "ended" && endsAt) return { state: "ended", at: endsAt };
    }
    return { state: "shown" };
  }
  return { state: "direct" };
}
