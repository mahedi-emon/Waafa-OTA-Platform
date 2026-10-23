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

/** The price a list shows for a record in taka (VAT included), when its list has one (D0 R5). */
export function listPriceOf(data: Record<string, unknown>): number | undefined {
  for (const key of ["fromPrice", "farePerAdult", "price", "pricePerNight", "dealPrice"]) {
    if (typeof data[key] === "number") return data[key] as number;
  }
  const variants = Array.isArray(data.variants)
    ? (data.variants as Array<{ price?: unknown }>)
    : [];
  const prices = variants.flatMap((variant) =>
    typeof variant.price === "number" ? [variant.price] : [],
  );
  return prices.length > 0 ? Math.min(...prices) : undefined;
}
