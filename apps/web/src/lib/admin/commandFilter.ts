/*
 * How the admin's pickers match what staff type (D0 R7). cmdk's default is fuzzy: "thai" also found "International
 * Trading" and "Kathmandu" from letters spread over several words. Here every typed word has to appear as it is:
 * at the start of a word it ranks first, inside a word it still counts, scattered letters don't.
 */

const WORD_BREAK = /[\s/\-(),.·:]/;

/** cmdk `filter`: 1 for word starts, 0.5 for a match inside a word, 0 for no match. */
export function wordFilter(value: string, search: string, keywords?: string[]): number {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let score = 1;
  for (const term of terms) {
    const at = haystack.indexOf(term);
    if (at === -1) return 0;
    let start = at;
    // A later occurrence at a word start ranks the item higher ("bali" in "Global Bali").
    while (start !== -1 && start > 0 && !WORD_BREAK.test(haystack[start - 1] ?? "")) {
      start = haystack.indexOf(term, start + 1);
    }
    if (start === -1) score *= 0.5;
  }
  return score;
}
