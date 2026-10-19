import type { Path } from "../schema";

/**
 * A field's pattern: the names on its path joined with "_", list positions left out ("prices_price"). A list item
 * itself is "<list>_item" ("gallery_item"), so a list and its items can have different widgets.
 */
export function patternOf(path: Path): string {
  const names = path.filter((part): part is string => typeof part === "string").join("_");
  return typeof path.at(-1) === "number" ? childPattern(names, "item") : names;
}

/** The pattern of a child field. */
export function childPattern(parent: string, name: string): string {
  return parent ? `${parent}_${name}` : name;
}

/** The last name on a pattern ("prices_price" → "price"). */
export function leafOf(pattern: string): string {
  return pattern.split("_").at(-1) ?? pattern;
}

/** Turns an API path ("prices.2.price") into a path with list positions as numbers. */
export function pathFromDotted(dotted: string): Path {
  if (!dotted) return [];
  return dotted.split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

/** "prices.2.price" for errors and element ids. */
export function dottedOf(path: Path): string {
  return path.map(String).join(".");
}

/**
 * Every concrete path in `value` that matches `pattern`: list items expand ("prices_price" over three rows gives
 * prices.0.price, prices.1.price, prices.2.price). Missing parents give no paths.
 */
export function pathsMatching(value: unknown, pattern: string): Path[] {
  const names = pattern ? pattern.split("_") : [];
  const out: Path[] = [];
  const walk = (current: unknown, index: number, at: Path) => {
    if (Array.isArray(current)) {
      // "<list>_item" names the items themselves; otherwise the pattern goes on inside every item.
      const next = names[index] === "item" ? index + 1 : index;
      current.forEach((item, position) => walk(item, next, [...at, position]));
      return;
    }
    if (index === names.length) {
      out.push(at);
      return;
    }
    if (!current || typeof current !== "object") return;
    const name = names[index] as string;
    const record = current as Record<string, unknown>;
    if (!Object.hasOwn(record, name)) {
      // The field itself may be absent; its parent is still a match for rules that create it.
      if (index === names.length - 1) out.push([...at, name]);
      return;
    }
    walk(record[name], index + 1, [...at, name]);
  };
  walk(value, 0, []);
  return out;
}
