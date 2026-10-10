/** Splits `text` around the first case-insensitive match of `query`, for bold matches in picker lists. */
export function highlight(
  text: string,
  query: string,
): { before: string; match: string; after: string } {
  const needle = query.trim().toLowerCase();
  const index = needle ? text.toLowerCase().indexOf(needle) : -1;
  if (index < 0) return { before: text, match: "", after: "" };
  return {
    before: text.slice(0, index),
    match: text.slice(index, index + needle.length),
    after: text.slice(index + needle.length),
  };
}

/** True when every word of the query appears somewhere in the haystack (order-free, case-insensitive). */
export function matchesQuery(haystack: string, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = haystack.toLowerCase();
  return words.every((word) => text.includes(word));
}
