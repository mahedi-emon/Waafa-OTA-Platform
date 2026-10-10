/*
 * Guest cart lines (FR-SHOP-06): pure updates, used by the browser cart store. Quantities stay between 1 and the
 * variant's stock (or MAX_LINE_QTY for pre-orders); a line with 0 is removed. Prices are a snapshot for display; the
 * checkout re-prices from the catalogue (A14).
 */

export const MAX_LINE_QTY = 99;

export type CartLine = {
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  /** "Navy · L", empty for single-variant products. */
  variantLabel: string;
  sku: string;
  image?: { src: string; alt: string };
  price: number;
  qty: number;
  /** Highest quantity allowed (stock, or MAX_LINE_QTY for pre-orders). */
  maxQty: number;
};

const clamp = (qty: number, max: number) =>
  Math.max(0, Math.min(Math.round(qty), max, MAX_LINE_QTY));

export function addLine(lines: readonly CartLine[], line: CartLine): CartLine[] {
  const existing = lines.find((item) => item.variantId === line.variantId);
  if (!existing)
    return line.qty > 0 ? [...lines, { ...line, qty: clamp(line.qty, line.maxQty) }] : [...lines];
  return lines.map((item) =>
    item.variantId === line.variantId
      ? { ...item, ...line, qty: clamp(item.qty + line.qty, line.maxQty) }
      : item,
  );
}

export function setLineQty(lines: readonly CartLine[], variantId: string, qty: number): CartLine[] {
  return lines
    .map((item) =>
      item.variantId === variantId ? { ...item, qty: clamp(qty, item.maxQty) } : item,
    )
    .filter((item) => item.qty > 0);
}

export function removeLine(lines: readonly CartLine[], variantId: string): CartLine[] {
  return lines.filter((item) => item.variantId !== variantId);
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, item) => sum + item.qty, 0);
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** Lines read back from storage: anything malformed is dropped rather than crashing the store. */
export function parseLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is CartLine =>
        typeof item === "object" &&
        item !== null &&
        typeof item.variantId === "string" &&
        typeof item.productId === "string" &&
        typeof item.qty === "number" &&
        typeof item.price === "number" &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}
