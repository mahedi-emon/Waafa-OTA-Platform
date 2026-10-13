/** Search results show about 60 characters of a title and 155 of a description (issue 173). */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/**
 * Shortens text to `max` characters at a word boundary, ending with "…"; text that already fits is returned as it
 * is. Whitespace is collapsed first, so admin text with line breaks reads as one line.
 */
export function clampText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  // The cut already ends a word when the next character is a space or punctuation.
  const wordEnds = /[\s,;:.·|–—-]/.test(clean.charAt(max - 1));
  const space = cut.lastIndexOf(" ");
  const head = (wordEnds || space <= max * 0.6 ? cut : cut.slice(0, space)).replace(
    /[\s,;:.·|–—-]+$/,
    "",
  );
  return `${head}…`;
}

/**
 * The document title for a page title and the site template ("%s | Waafa"): the templated form when it fits in 60
 * characters, else the page title alone, shortened if it is still too long. Returns `absolute` when the template
 * must not be applied.
 */
export function fitTitle(title: string, template: string): { title: string; absolute: boolean } {
  const clean = title.replace(/\s+/g, " ").trim();
  if (template.replace("%s", clean).length <= TITLE_MAX) return { title: clean, absolute: false };
  return { title: clampText(clean, TITLE_MAX), absolute: true };
}
