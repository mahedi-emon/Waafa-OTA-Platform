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
