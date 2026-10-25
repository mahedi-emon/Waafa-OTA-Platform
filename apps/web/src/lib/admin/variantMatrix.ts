import { camelKey } from "./blueprints/automatic";
import { freeId } from "./blueprints/slug";

/*
 * The product variants matrix (D0 R8): every mix of the product's option values is a row staff can sell, with its
 * own stock code, price and stock. These helpers work out the rows and keep them matched to the stored variants;
 * no zod here, the matrix runs in the browser (D202).
 */

export type MatrixOption = { key?: string; label?: string; values?: Array<{ value?: string }> };
export type MatrixVariant = {
  id?: string;
  sku?: string;
  options?: Record<string, string>;
  price?: number;
  mrp?: number;
  stock?: number;
  lowStockAt?: number;
  preOrder?: boolean;
  images?: unknown[];
};
export type Combo = Record<string, string>;

/**
 * Each option's key as the save will store it: its own key, or one made from its label the way the editor's
 * automatic rule makes it (unique in the list), so new options match before their first save.
 */
export function optionKeys(options: readonly MatrixOption[]): string[] {
  const taken = new Set(options.map((option) => option.key).filter((key): key is string => !!key));
  return options.map((option) => {
    if (option.key) return option.key;
    const base = camelKey(option.label || "option");
    let key = base;
    for (let n = 2; taken.has(key); n += 1) key = `${base}${n}`;
    taken.add(key);
    return key;
  });
}

/** Every mix of option values, in option order ("Black, Single", "Black, Twin"…); one empty mix without options. */
export function combinations(options: readonly MatrixOption[]): Combo[] {
  const keys = optionKeys(options);
  let combos: Combo[] = [{}];
  options.forEach((option, index) => {
    const key = keys[index] ?? "option";
    const values = (option.values ?? [])
      .map((item) => item.value?.trim() ?? "")
      .filter((value, at, all) => value !== "" && all.indexOf(value) === at);
    if (values.length === 0) return;
    combos = combos.flatMap((combo) => values.map((value) => ({ ...combo, [key]: value })));
  });
  // An option without values yet adds nothing: those rows wait until it has some.
  return combos;
}

/** Whether a stored variant is this mix (same keys, same values). */
export function sameCombo(a: Combo | undefined, b: Combo): boolean {
  const left = a ?? {};
  const keys = Object.keys(b);
  return Object.keys(left).length === keys.length && keys.every((key) => left[key] === b[key]);
}

/** The words of a mix in option order: "Black · Twin pack". */
export function comboWords(options: readonly MatrixOption[], combo: Combo): string {
  return optionKeys(options)
    .map((key) => combo[key])
    .filter((value): value is string => !!value)
    .join(" · ");
}

/** A stock code from the product's short name and the mix ("HP-26A-BLACK"), unique among the others. */
export function suggestSku(base: string, combo: Combo, taken: ReadonlySet<string>): string {
  const part = (text: string) =>
    text
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .toUpperCase();
  const head = part(base).slice(0, 20) || "ITEM";
  const sku = [head, ...Object.values(combo).map(part)].filter(Boolean).join("-").slice(0, 40);
  if (!taken.has(sku)) return sku;
  for (let n = 2; ; n += 1) {
    const next = `${sku.slice(0, 36)}-${n}`;
    if (!taken.has(next)) return next;
  }
}

/** A new variant for a mix, priced like the product's default variant until staff change it. */
export function newVariant(
  combo: Combo,
  variants: readonly MatrixVariant[],
  base: string,
  priceFrom?: number,
): MatrixVariant {
  const skus = new Set(
    variants.map((variant) => variant.sku).filter((sku): sku is string => !!sku),
  );
  const sku = suggestSku(base, combo, skus);
  const ids = new Set(variants.map((variant) => variant.id).filter((id): id is string => !!id));
  return {
    id: freeId(sku, ids, "variant"),
    sku,
    options: combo,
    ...(priceFrom !== undefined ? { price: priceFrom } : {}),
    stock: 0,
    lowStockAt: 3,
    preOrder: false,
    images: [],
  };
}

/** Variants that match no mix any more (an option value was removed or renamed). */
export function strayVariants(
  options: readonly MatrixOption[],
  variants: readonly MatrixVariant[],
): MatrixVariant[] {
  const combos = combinations(options);
  return variants.filter((variant) => !combos.some((combo) => sameCombo(variant.options, combo)));
}
