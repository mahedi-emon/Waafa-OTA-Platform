import { describe, expect, it } from "vitest";
import type { Coupon, Product } from "../schemas/shop";
import type { ShippingSettings } from "../schemas/settings";
import { couponDiscount, priceCart, zoneForArea } from "./orderPricing";

const shipping: ShippingSettings = {
  zones: [
    { id: "dhaka", name: "Inside Dhaka", areas: ["Dhaka"], charge: 80, estimate: "1 to 2 days" },
    { id: "out", name: "Outside Dhaka", areas: ["*"], charge: 150, estimate: "2 to 4 days" },
  ],
  minimumOrder: 300,
  freeDeliveryThreshold: 3000,
  officePickup: true,
};

function product(id: string, price: number, stock: number, extra: Partial<Product> = {}): Product {
  return {
    id,
    slug: id,
    title: `Product ${id}`,
    status: "published",
    codEligible: true,
    options: [{ key: "size", label: "Size", display: "pill", values: [{ value: "M" }] }],
    images: [{ src: "/a.jpg", alt: "a" }],
    variants: [
      {
        id: `${id}-v`,
        sku: `SKU-${id}`,
        options: { size: "M" },
        price,
        stock,
        images: [],
        preOrder: false,
        lowStockAt: 3,
      },
    ],
    ...extra,
  } as unknown as Product;
}

const welcome: Coupon = {
  code: "WELCOME10",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxDiscount: 300,
  startsAt: "2026-10-01T00:00:00+06:00",
  enabled: true,
  sample: true,
};

const base = {
  shipping,
  payment: { codLimit: 20000 },
  coupon: null,
  delivery: { kind: "zone", zoneId: "dhaka" } as const,
};

describe("zoneForArea", () => {
  it("matches the division or district, otherwise falls back to the * zone", () => {
    expect(zoneForArea(shipping, { division: "Dhaka" }).id).toBe("dhaka");
    expect(zoneForArea(shipping, { division: "Sylhet", district: "dhaka" }).id).toBe("dhaka");
    expect(zoneForArea(shipping, { division: "Sylhet" }).id).toBe("out");
  });
});

describe("couponDiscount", () => {
  it("takes a percentage up to the cap and never more than the subtotal", () => {
    expect(couponDiscount(welcome, 1000)).toBe(100);
    expect(couponDiscount(welcome, 9000)).toBe(300);
    expect(
      couponDiscount({ ...welcome, type: "fixed", value: 500, maxDiscount: undefined }, 400),
    ).toBe(400);
  });
  it("gives nothing under the minimum order", () => {
    expect(couponDiscount({ ...welcome, minOrder: 1500 }, 1000)).toBe(0);
  });
});

describe("priceCart", () => {
  it("adds delivery, applies the coupon and keeps total = subtotal - discount + delivery", () => {
    const quote = priceCart({
      ...base,
      products: [product("a", 500, 10)],
      lines: [{ variantId: "a-v", quantity: 2 }],
      coupon: welcome,
      couponCode: "welcome10",
    });
    expect(quote.subtotal).toBe(1000);
    expect(quote.discount).toBe(100);
    expect(quote.delivery).toBe(80);
    expect(quote.total).toBe(980);
    expect(quote.coupon).toEqual({ state: "applied", code: "WELCOME10", discount: 100 });
    expect(quote.freeDeliveryRemaining).toBe(2000);
    expect(quote.ready).toBe(true);
  });

  it("makes delivery free from the threshold and for pick-up", () => {
    const products = [product("a", 3000, 5)];
    const lines = [{ variantId: "a-v", quantity: 1 }];
    expect(priceCart({ ...base, products, lines }).delivery).toBe(0);
    expect(priceCart({ ...base, products, lines }).freeDelivery).toBe(true);
    const pickup = priceCart({
      ...base,
      products: [product("a", 500, 5)],
      lines,
      delivery: { kind: "pickup" },
    });
    expect(pickup.delivery).toBe(0);
    expect(pickup.freeDelivery).toBe(false);
  });

  it("lowers a line to the stock left and marks it adjusted; sold out is unavailable", () => {
    const adjusted = priceCart({
      ...base,
      products: [product("a", 500, 2)],
      lines: [{ variantId: "a-v", quantity: 5 }],
    });
    expect(adjusted.lines[0]).toMatchObject({
      quantity: 2,
      requestedQuantity: 5,
      status: "adjusted",
    });
    expect(adjusted.ready).toBe(false);
    const gone = priceCart({
      ...base,
      products: [product("a", 500, 0)],
      lines: [{ variantId: "a-v", quantity: 1 }],
    });
    expect(gone.lines[0]).toMatchObject({ quantity: 0, status: "unavailable" });
  });

  it("merges duplicate lines and ignores unknown or unpublished variants", () => {
    const quote = priceCart({
      ...base,
      products: [product("a", 500, 10), product("b", 100, 10, { status: "draft" })],
      lines: [
        { variantId: "a-v", quantity: 1 },
        { variantId: "a-v", quantity: 2 },
        { variantId: "b-v", quantity: 1 },
        { variantId: "nope", quantity: 1 },
      ],
    });
    expect(quote.lines).toHaveLength(1);
    expect(quote.count).toBe(3);
  });

  it("reports invalid and below-minimum coupons without discounting", () => {
    const products = [product("a", 500, 10)];
    const lines = [{ variantId: "a-v", quantity: 1 }];
    expect(priceCart({ ...base, products, lines, couponCode: "NOPE" }).coupon).toEqual({
      state: "invalid",
      code: "NOPE",
    });
    const low = priceCart({
      ...base,
      products,
      lines,
      coupon: { ...welcome, minOrder: 2000 },
      couponCode: "WELCOME10",
    });
    expect(low.coupon).toEqual({ state: "below-minimum", code: "WELCOME10", minOrder: 2000 });
    expect(low.discount).toBe(0);
  });

  it("blocks cash on delivery above the limit or for an ineligible item", () => {
    const lines = [{ variantId: "a-v", quantity: 1 }];
    expect(priceCart({ ...base, products: [product("a", 25000, 5)], lines }).cod).toEqual({
      allowed: false,
      reason: "limit",
    });
    expect(
      priceCart({ ...base, products: [product("a", 500, 5, { codEligible: false })], lines }).cod,
    ).toEqual({ allowed: false, reason: "item" });
    expect(priceCart({ ...base, products: [product("a", 500, 5)], lines }).cod.allowed).toBe(true);
  });

  it("flags an order under the store minimum", () => {
    const quote = priceCart({
      ...base,
      products: [product("a", 100, 5)],
      lines: [{ variantId: "a-v", quantity: 1 }],
    });
    expect(quote.belowMinimum).toBe(200);
  });
});
