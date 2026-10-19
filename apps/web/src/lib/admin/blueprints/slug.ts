/** A web address part from any text: "Bali 5 Days & 4 Nights" → "bali-5-days-4-nights" (SlugSchema rules). */
export function slugify(text: string, max = 80): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return slug;
}

/** Four lowercase letters or digits, to keep generated ids apart. */
export function shortCode(random: () => number = Math.random): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let code = "";
  for (let index = 0; index < 4; index += 1)
    code += alphabet[Math.floor(random() * alphabet.length)] ?? "x";
  return code;
}

/** An id from a title that is not in `taken`: "visa-help" or, when taken, "visa-help-7k2m". */
export function freeId(
  title: string,
  taken: ReadonlySet<string>,
  fallback = "item",
  random?: () => number,
): string {
  const base = slugify(title, 48) || fallback;
  if (!taken.has(base)) return base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base}-${shortCode(random)}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
