import "server-only";
import {
  OrderCreateInputSchema,
  priceCart,
  zoneForArea,
  type DeliveryChoice,
  type Order,
  type OrderCreated,
  type Quote,
} from "@waafa/shared";
import { withDeals } from "@/lib/shop/deals";
import { getPaymentSettings, getShippingSettings } from "./settings";
import { repositories } from "./source";

/*
 * Cart quotes and order intake (FR-SHOP-06 to 09). Never cached: stock, deals and coupons change by the minute, and
 * every call at checkout must price from the current catalogue. The browser sends variant ids and quantities only.
 */

export type QuoteRequest = {
  lines: Array<{ variantId: string; quantity: number }>;
  couponCode?: string;
  delivery: DeliveryChoice;
};

async function pricedProducts(variantIds: string[], now: Date) {
  const [products, deals] = await Promise.all([
    repositories.shop.getProductsByVariantIds(variantIds),
    repositories.shop.listDeals(now),
  ]);
  return products.map((product) => withDeals(product, deals));
}

export async function quoteCart(request: QuoteRequest): Promise<Quote> {
  const now = new Date();
  const [products, shipping, payment, coupon] = await Promise.all([
    pricedProducts(
      request.lines.map((line) => line.variantId),
      now,
    ),
    getShippingSettings(),
    getPaymentSettings(),
    request.couponCode ? repositories.shop.findCoupon(request.couponCode, now) : null,
  ]);
  return priceCart({
    lines: request.lines,
    products,
    coupon,
    couponCode: request.couponCode,
    delivery: request.delivery,
    shipping,
    payment,
  });
}

export type PlaceOrderResult =
  | { ok: true; order: OrderCreated }
  | { ok: false; reason: "invalid" | "changed" | "cod" | "minimum" | "pickup"; quote?: Quote };

/** Validates the checkout payload, prices it from the catalogue and stores the order. */
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = OrderCreateInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const order = parsed.data;
  const shipping = await getShippingSettings();
  if (order.pickup && !shipping.officePickup) return { ok: false, reason: "pickup" };
  const delivery: DeliveryChoice = order.pickup
    ? { kind: "pickup" }
    : { kind: "zone", zoneId: zoneForArea(shipping, order.address).id };
  const quote = await quoteCart({
    lines: order.lines,
    couponCode: order.couponCode,
    delivery,
  });
  if (!quote.ready) return { ok: false, reason: "changed", quote };
  if (quote.belowMinimum !== null) return { ok: false, reason: "minimum", quote };
  if (order.payment.method === "cod" && (!quote.cod.allowed || order.pickup)) {
    return { ok: false, reason: "cod", quote };
  }

  const stored: Order = await repositories.shop.createOrder(
    {
      items: quote.lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        title: line.title,
        variantLabel: line.variantLabel || undefined,
        sku: line.sku,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        image: line.image,
      })),
      subtotal: quote.subtotal,
      discount: quote.discount,
      delivery: quote.delivery,
      total: quote.total,
      couponCode: quote.coupon.state === "applied" ? quote.coupon.code : undefined,
      payment: order.payment,
      paymentVerified: false,
      address: order.address,
      pickup: order.pickup,
      invoice: order.invoice,
    },
    new Date(),
  );
  return {
    ok: true,
    order: { reference: stored.reference, total: stored.total, createdAt: stored.createdAt },
  };
}

/** Track order: the reference and the phone number on it must both match. */
export async function trackOrder(reference: string, phone: string): Promise<Order | null> {
  return repositories.shop.findOrder(reference, phone);
}
