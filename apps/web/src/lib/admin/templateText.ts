const TOKEN = /\{\{([a-z][a-z0-9_]*)\}\}/g;

/** The details a template may carry, from its stored list ("{{reference}}" → "reference"), in order, once each. */
export function templateVariables(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names = value.flatMap((item) => {
    const match = typeof item === "string" ? /^\{\{([a-z][a-z0-9_]*)\}\}$/.exec(item) : null;
    return match?.[1] ? [match[1]] : [];
  });
  return [...new Set(names)];
}

/** A template with each detail filled in (the live preview uses sample details). */
export function fillTemplate(text: string, value: (name: string) => string): string {
  return text.replace(TOKEN, (_, name: string) => value(name));
}

/** Text with a detail put in place of the selection (or at the cursor), and where the cursor goes next. */
export function insertAt(
  text: string,
  token: string,
  start: number,
  end: number,
): { text: string; cursor: number } {
  const from = Math.max(0, Math.min(start, end, text.length));
  const to = Math.max(from, Math.min(Math.max(start, end), text.length));
  // Keep words apart: a space before the detail when it would touch the word before it.
  const before = text.slice(0, from);
  const gap = before !== "" && !/[\s([{"'“]$/.test(before) ? " " : "";
  const next = `${before}${gap}${token}${text.slice(to)}`;
  return { text: next, cursor: from + gap.length + token.length };
}
