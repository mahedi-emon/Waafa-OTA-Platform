/** A person a note may mention. */
export type Mentionable = { id: string; name: string };

const isWordChar = (char: string | undefined) => !!char && /[\p{L}\p{N}_]/u.test(char);

/**
 * The people a note mentions as "@Full Name" (issue 243), each once, in the order they first appear. A name counts
 * only as a whole word: not inside an email address ("desk@Ayesha…") and not as the start of a longer word. Longer
 * names win over shorter ones that start the same way ("@Ayesha Rahman" is not also "@Ayesha"). Case is ignored.
 */
export function findMentions(body: string, people: readonly Mentionable[]): string[] {
  const text = body.toLowerCase();
  const taken = new Array<boolean>(text.length).fill(false);
  const found: Array<{ id: string; at: number }> = [];
  const byLength = [...people]
    .filter((person) => person.name.trim().length > 0)
    .sort((a, b) => b.name.length - a.name.length);
  for (const person of byLength) {
    const needle = `@${person.name.trim().toLowerCase()}`;
    let from = 0;
    for (;;) {
      const at = text.indexOf(needle, from);
      if (at < 0) break;
      from = at + 1;
      const end = at + needle.length;
      if (isWordChar(body[at - 1]) || isWordChar(body[end]) || taken[at]) continue;
      for (let index = at; index < end; index += 1) taken[index] = true;
      if (!found.some((item) => item.id === person.id)) found.push({ id: person.id, at });
    }
  }
  return found.sort((a, b) => a.at - b.at).map((item) => item.id);
}
