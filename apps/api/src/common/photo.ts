/** The record's first photo for lists, pickers and search results, wherever its schema keeps it. */
export function photoOf(data: Record<string, unknown>): string | undefined {
  for (const key of ["cover", "image", "photo", "logo", "poster", "hero"]) {
    const value = data[key];
    if (value && typeof value === "object" && typeof (value as { src?: unknown }).src === "string")
      return (value as { src: string }).src;
  }
  for (const key of ["images", "gallery", "photos"]) {
    const list = data[key];
    if (Array.isArray(list) && list[0] && typeof list[0] === "object") {
      const src = (list[0] as { src?: unknown }).src;
      if (typeof src === "string") return src;
    }
  }
  return undefined;
}
