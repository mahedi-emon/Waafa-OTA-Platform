import { formatTaka } from "@waafa/shared";
import { formatDhakaDateTime, formatPlainDate } from "../format";
import type { Change } from "./diff";
import type { ResolvedBlueprint } from "./types";

/** The words History needs, from Admin.editor.history (passed in so this stays a plain function). */
export type HistoryWords = {
  change: (field: string, from: string, to: string) => string;
  set: (field: string, to: string) => string;
  cleared: (field: string) => string;
  edited: (field: string) => string;
  list: (field: string, from: number, to: number) => string;
  on: string;
  off: string;
};

const MAX = 60;
const short = (text: string) => (text.length > MAX ? `${text.slice(0, MAX - 1)}…` : text);

/** A value as History shows it: ৳ with lakh grouping, dates as "12 Oct 2026", switches as On / Off, labels for choices. */
export function valueWords(
  blueprint: ResolvedBlueprint,
  pattern: string,
  value: unknown,
  words: Pick<HistoryWords, "on" | "off">,
): string {
  const field = blueprint.fields[pattern];
  const label = (item: unknown) =>
    field?.choices?.find((choice) => choice.value === item)?.label ?? String(item);
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return short(value.map(label).join(", "));
  switch (field?.widget) {
    case "money":
      return typeof value === "number" ? formatTaka(value) : String(value);
    case "switch":
      return value === true ? words.on : words.off;
    case "date":
      return typeof value === "string" ? formatPlainDate(value) : String(value);
    case "dateTime":
      return typeof value === "string" ? formatDhakaDateTime(value) : String(value);
    case "choice":
    case "readOnly":
      return label(value);
    default:
      if (typeof value === "boolean") return value ? words.on : words.off;
      if (typeof value === "object") return "…";
      return short(String(value));
  }
}

/** One change as a sentence: "Price per person (2): ৳64,900 → ৳59,900". */
export function changeSentence(
  blueprint: ResolvedBlueprint,
  change: Change,
  words: HistoryWords,
): string {
  const row = change.path.findLast((part) => typeof part === "number");
  const field = `${blueprint.fields[change.pattern]?.label ?? change.pattern}${typeof row === "number" ? ` (${row + 1})` : ""}`;
  switch (change.kind) {
    case "changed":
      return words.change(
        field,
        valueWords(blueprint, change.pattern, change.from, words),
        valueWords(blueprint, change.pattern, change.to, words),
      );
    case "set":
      return change.to === undefined
        ? words.edited(field)
        : words.set(field, valueWords(blueprint, change.pattern, change.to, words));
    case "cleared":
      return words.cleared(field);
    case "edited":
      return words.edited(field);
    case "list":
      return words.list(field, change.from, change.to);
  }
}
