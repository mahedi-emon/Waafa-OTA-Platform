import "server-only";
import type { AccountView, Product } from "@waafa/shared";
import { listProducts } from "@/lib/data/shop";
import { MAX_LINE_QTY, type CartLine } from "./cart";

type OrderItem = AccountView["orders"][number]["items"][number];

/** Every published product by id (the catalogue is small; read in pages of 100). */
async function productsById(): Promise<Map<string, Product>> {
  const all = new Map<string, Product>();
  for (let offset = 0; offset < 5_000; offset += 100) {
    const page = await listProducts({ offset, limit: 100 });
    for (const product of page.items) all.set(product.id, product);
    if (offset + 100 >= page.total) break;
  }
  return all;
}

/**
 * Cart lines to buy an order again (issue 246): today's price and stock, the same quantities up to what is in stock.
 * Items no longer sold, out of stock or with a hidden price (asked on WhatsApp, D177) are left out.
 */
export async function buyAgainLines(
  orders: ReadonlyArray<{ reference: string; items: OrderItem[] }>,
): Promise<Map<string, CartLine[]>> {
  if (orders.every((order) => order.items.length === 0)) return new Map();
  const products = await productsById();
  const out = new Map<string, CartLine[]>();
  for (const order of orders) {
    const lines: CartLine[] = [];
    for (const item of order.items) {
      const product = products.get(item.productId);
      const variant = product?.variants.find((entry) => entry.id === item.variantId);
      if (!product || !variant || !product.showPrice || variant.stock <= 0) continue;
      const max = Math.min(variant.stock, MAX_LINE_QTY);
      const image = variant.images[0] ?? product.images[0];
      lines.push({
        productId: product.id,
        variantId: variant.id,
        slug: product.slug,
        title: product.title,
        variantLabel: item.variantLabel ?? "",
        sku: variant.sku,
        ...(image ? { image: { src: image.src, alt: image.alt } } : {}),
        price: variant.price,
        qty: Math.min(item.quantity, max),
        maxQty: max,
      });
    }
    if (lines.length > 0) out.set(order.reference, lines);
  }
  return out;
}
