import type { Product } from "@waafa/shared";

/**
 * A product as the public pages may see it (issue 178): when the admin keeps its price hidden, every variant price is
 * blanked, so neither the page nor the data sent to the browser carries it. The cart never sells such a product.
 */
export function publicProduct(product: Product): Product {
  if (product.showPrice) return product;
  return {
    ...product,
    variants: product.variants.map(({ mrp: _mrp, ...variant }) => ({ ...variant, price: 0 })),
  };
}
