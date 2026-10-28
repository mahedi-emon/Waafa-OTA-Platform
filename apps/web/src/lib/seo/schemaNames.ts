/** Store names search may still know (issue 302): written only as structured data alternateName, never shown. */
export const FORMER_STORE_NAMES = ["Waafas World"] as const;

/** A name as structured data writes it, with plain apostrophes ("Waafa's World"); pages show the typographic one. */
export function schemaName(name: string): string {
  return name.replaceAll("’", "'");
}

/** The store's former names, minus any that equal its current name (so an admin rename back never repeats it). */
export function formerStoreNames(storeName: string): string[] {
  const current = schemaName(storeName).trim().toLowerCase();
  return FORMER_STORE_NAMES.filter((name) => name.toLowerCase() !== current);
}
