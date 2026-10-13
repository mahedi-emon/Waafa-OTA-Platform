import { formatTaka, type VisaPrice } from "@waafa/shared";

/**
 * A visa price as visitors read it (issue 179): "৳7,500 – ৳9,500", or the "From {price}" template filled with the
 * starting price when there is no top. Never a single fixed price.
 */
export function formatVisaPrice(price: VisaPrice, fromTemplate: string): string {
  if (price.max !== undefined && price.max > price.min) {
    return `${formatTaka(price.min)} – ${formatTaka(price.max)}`;
  }
  return fromTemplate.replace("{price}", formatTaka(price.min));
}
