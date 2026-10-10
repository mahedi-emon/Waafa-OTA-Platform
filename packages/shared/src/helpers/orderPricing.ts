import type { Coupon, Product, Variant } from "../schemas/shop";
import type { PaymentSettings, ShippingSettings, ShippingZone } from "../schemas/settings";

/*
 * Order pricing (FR-SHOP-06/07/08): one pure function shared by the cart page quote, the checkout and the order
 * intake, so the browser never decides a price. Products arrive with running deals already applied (the variant
 * price is the effective price). All amounts are whole taka, VAT included (PRD §10).
 */

export type PricingLineInput = { variantId: string; quantity: number };

export type DeliveryChoice = { kind: "zone"; zoneId: string } | { kind: "pickup" };

export type PricedLineStatus = "ok" | "adjusted" | "unavailable";

export type PricedLine = {
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  /** "Navy · L", empty for single-variant products. */
  variantLabel: string;
  sku: string;
  image?: { src: string; alt: string };
  unitPrice: number;
  mrp?: number;
  /** Quantity charged: the requested one, lowered to stock; 0 when unavailable. */
  quantity: number;
  requestedQuantity: number;
  maxQuantity: number;
  lineTotal: number;
  status: PricedLineStatus;
  codEligible: boolean;
};

export type CouponStatus =
  | { state: "none" }
  | { state: "applied"; code: string; discount: number }
  | { state: "invalid"; code: string }
  | { state: "below-minimum"; code: string; minOrder: number };

export type Quote = {
  lines: PricedLine[];
  count: number;
  /** What the items would cost at MRP, for the "You save" line. */
  mrpTotal: number;
  subtotal: number;
  discount: number;
  coupon: CouponStatus;
  delivery: number;
  deliveryLabel: string;
  deliveryEstimate: string;
  freeDelivery: boolean;
  /** Taka still to add for free delivery; null when there is no threshold or it is reached. */
  freeDeliveryRemaining: number | null;
  total: number;
  belowMinimum: number | null;
  cod: { allowed: boolean; reason: "limit" | "item" | null };
  /** True when every line can be ordered as requested. */
  ready: boolean;
};

export const MAX_ORDER_LINE_QTY = 99;

/** The label of a variant's options in option order, e.g. "Navy · L". */
export function variantLabel(product: Product, variant: Variant): string {
  return product.options
    .map((option) => variant.options[option.key])
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}

/** Highest quantity a variant can be ordered in: its stock, or the line limit for pre-orders. */
export function maxQuantity(variant: Variant): number {
  return variant.preOrder ? MAX_ORDER_LINE_QTY : Math.min(variant.stock, MAX_ORDER_LINE_QTY);
}

/** The zone that covers a division or district; the "*" zone is the fallback. */
export function zoneForArea(
  settings: ShippingSettings,
  area: { division?: string; district?: string },
): ShippingZone {
  const names = [area.division, area.district]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase());
  const named = settings.zones.find((zone) =>
    zone.areas.some((item) => item !== "*" && names.includes(item.trim().toLowerCase())),
  );
  return named ?? settings.zones.find((zone) => zone.areas.includes("*")) ?? settings.zones[0]!;
}

/** The discount a coupon gives on a subtotal; 0 when the order is under its minimum. */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal < coupon.minOrder) return 0;
  const raw =
    coupon.type === "percent" ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  const capped = coupon.maxDiscount === undefined ? raw : Math.min(raw, coupon.maxDiscount);
  return Math.min(Math.round(capped), subtotal);
}

export type PriceCartInput = {
  lines: readonly PricingLineInput[];
  /** Published products with deals applied. */
  products: readonly Product[];
  /** The coupon the visitor typed; null when the code was not found or not valid now. */
  coupon: Coupon | null;
  couponCode?: string;
  delivery: DeliveryChoice;
  shipping: ShippingSettings;
  payment: Pick<PaymentSettings, "codLimit">;
};

export function priceCart(input: PriceCartInput): Quote {
  const byVariant = new Map<string, { product: Product; variant: Variant }>();
  for (const product of input.products) {
    for (const variant of product.variants) byVariant.set(variant.id, { product, variant });
  }

  const merged = new Map<string, number>();
  for (const line of input.lines) {
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + Math.max(0, line.quantity));
  }

  const lines: PricedLine[] = [];
  for (const [variantId, requested] of merged) {
    const found = byVariant.get(variantId);
    if (!found || found.product.status !== "published") continue;
    const { product, variant } = found;
    const shot = variant.images[0] ?? product.images[0];
    const max = maxQuantity(variant);
    const quantity = Math.min(requested, max);
    const status: PricedLineStatus =
      max === 0 ? "unavailable" : quantity < requested ? "adjusted" : "ok";
    lines.push({
      productId: product.id,
      variantId,
      slug: product.slug,
      title: product.title,
      variantLabel: variantLabel(product, variant),
      sku: variant.sku,
      image: shot && { src: shot.src, alt: shot.alt },
      unitPrice: variant.price,
      mrp: variant.mrp,
      quantity,
      requestedQuantity: requested,
      maxQuantity: max,
      lineTotal: variant.price * quantity,
      status,
      codEligible: product.codEligible,
    });
  }

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const mrpTotal = lines.reduce(
    (sum, line) => sum + (line.mrp ?? line.unitPrice) * line.quantity,
    0,
  );

  let coupon: CouponStatus = { state: "none" };
  let discount = 0;
  const typed = input.couponCode?.trim().toUpperCase();
  if (typed) {
    if (!input.coupon || input.coupon.code !== typed) {
      coupon = { state: "invalid", code: typed };
    } else if (subtotal < input.coupon.minOrder) {
      coupon = { state: "below-minimum", code: typed, minOrder: input.coupon.minOrder };
    } else {
      discount = couponDiscount(input.coupon, subtotal);
      coupon = { state: "applied", code: typed, discount };
    }
  }

  const { shipping } = input;
  const threshold = shipping.freeDeliveryThreshold;
  const reachedFree = threshold !== undefined && subtotal >= threshold;
  let delivery = 0;
  let deliveryLabel = "";
  let deliveryEstimate = "";
  if (input.delivery.kind === "pickup") {
    deliveryLabel = "Office pick-up";
    deliveryEstimate = "Ready on the next working day";
  } else {
    const chosen = input.delivery;
    const zone = shipping.zones.find((item) => item.id === chosen.zoneId) ?? shipping.zones[0]!;
    deliveryLabel = zone.name;
    deliveryEstimate = zone.estimate;
    delivery = reachedFree || count === 0 ? 0 : zone.charge;
  }

  const total = subtotal - discount + delivery;
  const codReason: "limit" | "item" | null = lines.some((line) => !line.codEligible)
    ? "item"
    : total > input.payment.codLimit
      ? "limit"
      : null;

  return {
    lines,
    count,
    mrpTotal,
    subtotal,
    discount,
    coupon,
    delivery,
    deliveryLabel,
    deliveryEstimate,
    freeDelivery: input.delivery.kind === "zone" && count > 0 && reachedFree,
    freeDeliveryRemaining:
      threshold !== undefined && !reachedFree && count > 0 ? threshold - subtotal : null,
    total,
    belowMinimum:
      count > 0 && subtotal < shipping.minimumOrder ? shipping.minimumOrder - subtotal : null,
    cod: { allowed: codReason === null, reason: codReason },
    ready: count > 0 && lines.every((line) => line.status === "ok"),
  };
}
