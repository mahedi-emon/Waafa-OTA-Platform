/**
 * The "@word" being typed just before the caret in a note (issue 243), or null: a line break or a second "@" ends it,
 * and an "@" right after a letter or digit (an email address) never starts one.
 */
export function mentionQuery(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && /[\p{L}\p{N}_]/u.test(before[at - 1] ?? "")) return null;
  const query = before.slice(at + 1);
  if (/[\n@]/.test(query) || query.length > 40 || /\s{2}/.test(query)) return null;
  return { start: at, query };
}
