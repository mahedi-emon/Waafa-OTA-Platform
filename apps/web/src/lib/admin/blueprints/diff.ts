import type { Path } from "../schema";
import { patternOf } from "./paths";
import type { ResolvedBlueprint } from "./types";

/** One change between two saved versions, for History ("Price from ৳64,900 → ৳59,900"). */
export type Change =
  | { kind: "changed"; pattern: string; path: Path; from: unknown; to: unknown }
  | { kind: "set"; pattern: string; path: Path; to: unknown }
  | { kind: "cleared"; pattern: string; path: Path; from: unknown }
  | { kind: "edited"; pattern: string; path: Path }
  | { kind: "list"; pattern: string; path: Path; from: number; to: number };

/** Widgets whose value is too long or too structured to quote: History says "edited". */
const QUOTELESS = new Set(["richText", "textarea", "json", "map", "seo"]);

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What changed from one version to the next, field by field, in form order. Lists of groups report added or removed
 * items as a count change and look inside items only when the count stays the same; photos count as one change.
 */
export function changesBetween(
  before: unknown,
  after: unknown,
  blueprint: ResolvedBlueprint,
  limit = 60,
): Change[] {
  const changes: Change[] = [];

  const visit = (from: unknown, to: unknown, path: Path) => {
    if (changes.length >= limit || same(from, to)) return;
    const pattern = patternOf(path);
    const field = path.length > 0 ? blueprint.fields[pattern] : undefined;
    if (field?.hidden) return;
    const widget = field?.widget;

    if (widget === "image" || (widget && QUOTELESS.has(widget))) {
      changes.push(
        isEmpty(from)
          ? { kind: "set", pattern, path, to: widget === "image" ? undefined : to }
          : isEmpty(to)
            ? { kind: "cleared", pattern, path, from }
            : { kind: "edited", pattern, path },
      );
      return;
    }

    if (Array.isArray(from) || Array.isArray(to)) {
      const a = Array.isArray(from) ? from : [];
      const b = Array.isArray(to) ? to : [];
      const ofGroups = [...a, ...b].some((item) => item !== null && typeof item === "object");
      if (!ofGroups) {
        changes.push(
          isEmpty(from)
            ? { kind: "set", pattern, path, to }
            : isEmpty(to)
              ? { kind: "cleared", pattern, path, from }
              : { kind: "changed", pattern, path, from, to },
        );
        return;
      }
      if (a.length !== b.length) {
        changes.push({ kind: "list", pattern, path, from: a.length, to: b.length });
        return;
      }
      a.forEach((item, index) => visit(item, b[index], [...path, index]));
      return;
    }

    const fromGroup = from !== null && typeof from === "object";
    const toGroup = to !== null && typeof to === "object";
    if (fromGroup || toGroup) {
      const a = (fromGroup ? from : {}) as Record<string, unknown>;
      const b = (toGroup ? to : {}) as Record<string, unknown>;
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
      // Form order: the blueprint's sections first, then the rest as stored.
      if (path.length === 0) {
        const order = blueprint.sections.flatMap((section) => section.fields);
        keys.sort((x, y) => {
          const ix = order.indexOf(x);
          const iy = order.indexOf(y);
          return (ix === -1 ? 999 : ix) - (iy === -1 ? 999 : iy);
        });
      }
      for (const key of keys) visit(a[key], b[key], [...path, key]);
      return;
    }

    changes.push(
      isEmpty(from)
        ? { kind: "set", pattern, path, to }
        : isEmpty(to)
          ? { kind: "cleared", pattern, path, from }
          : { kind: "changed", pattern, path, from, to },
    );
  };

  visit(before, after, []);
  return changes;
}
