/** The list's URL state (D0 R5): search, filters, sort and page live in the address, so a view can be shared. */

export const PAGE_SIZES = [25, 50, 100] as const;

export type SortState = { key: string; dir: "asc" | "desc" } | null;

/** "title.asc" → { key: "title", dir: "asc" }; anything else → null. */
export function parseSort(value: string | null | undefined): SortState {
  const match = /^([A-Za-z]+)\.(asc|desc)$/.exec(value ?? "");
  return match ? { key: match[1] as string, dir: match[2] as "asc" | "desc" } : null;
}

/** The next sort when a header is pressed: ascending, descending, then back to the list's own order. */
export function nextSort(current: SortState, key: string): SortState {
  if (!current || current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return null;
}

/**
 * The address after a change: set or drop parameters. Changing anything but the page goes back to page 1, so a
 * filter never lands on an empty page.
 */
export function withQuery(
  path: string,
  current: URLSearchParams,
  changes: Record<string, string | null>,
): string {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  if (!("page" in changes)) next.delete("page");
  const search = next.toString();
  return search ? `${path}?${search}` : path;
}

/** "1–25 of 312" numbers for the pager. */
export function pageRange(page: number, pageSize: number, total: number) {
  if (total === 0) return { from: 0, to: 0, pages: 1 };
  const from = (page - 1) * pageSize + 1;
  return {
    from,
    to: Math.min(total, page * pageSize),
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** The page size in the address, when it is one the API accepts (25 otherwise). */
export function pageSizeOf(value: string | string[] | undefined): (typeof PAGE_SIZES)[number] {
  const size = Number(typeof value === "string" ? value : 25);
  return PAGE_SIZES.find((allowed) => allowed === size) ?? 25;
}

/** The sort in the address, when the list offers it; an unknown one falls back to the list's own order. */
export function sortOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
) {
  return allowed.find((sort) => sort === value);
}
