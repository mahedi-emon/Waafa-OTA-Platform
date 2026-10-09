/** The Bangladeshi taka sign (U+09F3). */
export const TAKA_SIGN = "৳";

const groupers = new Map<number, Intl.NumberFormat>();

/** Indian digit grouping (1,46,480) with a fixed number of decimals; formatters are reused. */
function grouper(decimals: number): Intl.NumberFormat {
  let formatter = groupers.get(decimals);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    groupers.set(decimals, formatter);
  }
  return formatter;
}

export interface FormatTakaOptions {
  /** Decimal places to show. Prices are whole taka, so the default is 0. */
  decimals?: 0 | 2;
}

/**
 * Formats an amount in taka with the ৳ sign and Indian grouping: `formatTaka(146480)` → `"৳1,46,480"`.
 * Prices on the site are VAT-inclusive whole taka; pass `{ decimals: 2 }` for statements and receipts.
 * Throws a RangeError for NaN or infinite amounts so a broken price never renders as "৳NaN".
 */
export function formatTaka(amount: number, options: FormatTakaOptions = {}): string {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`formatTaka expects a finite number, got ${amount}`);
  }
  const decimals = options.decimals ?? 0;
  const digits = grouper(decimals).format(Math.abs(amount));
  const sign = amount < 0 && digits.replace(/[0.,]/g, "") !== "" ? "-" : "";
  return `${sign}${TAKA_SIGN}${digits}`;
}

/** Formats a plain number with Indian grouping and no currency sign: `formatGrouped(123456)` → `"1,23,456"`. */
export function formatGrouped(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`formatGrouped expects a finite number, got ${value}`);
  }
  return grouper(0).format(value);
}
