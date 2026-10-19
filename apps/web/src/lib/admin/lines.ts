/**
 * Pasting several lines into one row of a lines field (a list copied from a document) makes one row per line: the
 * first line joins the text before the cursor and the last one the text after it. Null when only one line is pasted,
 * so the browser pastes it as usual.
 */
export function pasteIntoLines(
  lines: string[],
  index: number,
  start: number,
  end: number,
  text: string,
): string[] | null {
  const pieces = text
    .split(/\r?\n/)
    .map((piece) => piece.trim())
    .filter(Boolean);
  if (pieces.length < 2) return null;
  const current = lines[index] ?? "";
  const added = [
    current.slice(0, start) + (pieces[0] ?? ""),
    ...pieces.slice(1, -1),
    (pieces.at(-1) ?? "") + current.slice(end),
  ];
  const next = [...lines];
  next.splice(index, 1, ...added);
  return next;
}
