import "server-only";
import type { Product } from "@waafa/shared";
import { listBrands, listDeals, listProducts } from "@/lib/data/shop";
import type { ProductQuery } from "@/lib/data/types";
import { withDeals } from "./deals";
import { publicProduct } from "./publicProduct";

/*
 * Server helpers over the cached shop accessors: products with running deals applied (one effective price for
 * cards, product pages and the cart), hidden prices blanked, and brand names by id.
 */

export async function pricedProducts(query: ProductQuery) {
  const [page, deals] = await Promise.all([listProducts(query), listDeals()]);
  return {
    ...page,
    items: page.items.map((product) => publicProduct(withDeals(product, deals))),
  };
}

export async function pricedProduct(product: Product) {
  const deals = await listDeals();
  return publicProduct(withDeals(product, deals));
}

export async function brandNames(): Promise<Map<string, string>> {
  const brands = await listBrands();
  return new Map(brands.map((brand) => [brand.id, brand.name]));
}

/** The products of a campaign page (issue 247), in the campaign's order, priced like everywhere else. */
export async function campaignProducts(ids: readonly string[]): Promise<Product[]> {
  const wanted = new Set(ids);
  const found = new Map<string, Product>();
  for (let offset = 0; offset < 5_000 && found.size < wanted.size; offset += 100) {
    const page = await pricedProducts({ offset, limit: 100 });
    for (const product of page.items) if (wanted.has(product.id)) found.set(product.id, product);
    if (offset + 100 >= page.total) break;
  }
  return ids.flatMap((id) => {
    const product = found.get(id);
    return product ? [product] : [];
  });
}
