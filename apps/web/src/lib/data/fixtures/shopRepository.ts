import type { FixtureData } from "@waafa/fixtures";
import type { Category, Collection, Product } from "@waafa/shared";
import { byAdminOrder, isScheduledNow, matchesSearch, paginate } from "../query";
import type { DealWithProduct, ProductSort, ShopRepository } from "../types";

/** The lowest variant price, used for "from" prices, price filters and sorting. */
export function productFromPrice(product: Product): number {
  return Math.min(...product.variants.map((variant) => variant.price));
}

function isAvailable(product: Product): boolean {
  return product.variants.some((variant) => variant.stock > 0 || variant.preOrder);
}

/** Part codes compare without spaces or dashes and ignoring case: "crg-070h" matches "CRG 070H". */
function normalizeCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

/** A category and everything below it. */
function withDescendants(rootIds: readonly string[], categories: readonly Category[]): Set<string> {
  const ids = new Set(rootIds);
  let grew = true;
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId !== null && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }
  return ids;
}

const PRODUCT_SORTS: Record<ProductSort, (a: Product, b: Product) => number> = {
  popular: (a, b) => b.popularity - a.popularity,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => productFromPrice(a) - productFromPrice(b),
  "price-desc": (a, b) => productFromPrice(b) - productFromPrice(a),
};

/** A variant option with the key, or a spec row with the label, holds one of the values (case-insensitive). */
function hasAttribute(
  product: Product,
  filter: { key: string; label: string; values: string[] },
): boolean {
  if (filter.values.length === 0) return true;
  const wanted = filter.values.map((value) => value.toLowerCase());
  const fromVariants = product.variants.some((variant) => {
    const value = variant.options[filter.key];
    return value !== undefined && wanted.includes(value.toLowerCase());
  });
  const fromSpecs = product.specs.some(
    (spec) =>
      spec.label.toLowerCase() === filter.label.toLowerCase() &&
      wanted.some((value) => spec.value.toLowerCase().includes(value)),
  );
  return fromVariants || fromSpecs;
}

export function createFixtureShopRepository(data: FixtureData): ShopRepository {
  const published = () => data.products.filter((product) => product.status === "published");

  const inCollection = (product: Product, collection: Collection): boolean => {
    const { rule } = collection;
    if (rule.type === "manual") return rule.productIds.includes(product.id);
    if (rule.maxPrice !== undefined && productFromPrice(product) > rule.maxPrice) return false;
    if (
      rule.categoryIds &&
      !withDescendants(rule.categoryIds, data.categories).has(product.categoryId)
    )
      return false;
    if (rule.brandIds && !rule.brandIds.includes(product.brandId)) return false;
    if (rule.badges && !rule.badges.some((badge) => product.badges.includes(badge))) return false;
    return true;
  };

  const searchFields = (product: Product): string[] => [
    product.title,
    product.shortTitle,
    product.cardSpec ?? "",
    data.brands.find((brand) => brand.id === product.brandId)?.name ?? "",
    data.categories.find((category) => category.id === product.categoryId)?.name ?? "",
    ...product.variants.map((variant) => variant.sku),
    ...product.specs.map((spec) => spec.value),
  ];

  return {
    async listCategories() {
      return [...data.categories].sort((a, b) => a.level - b.level || a.order - b.order);
    },

    async getCategory(slug) {
      return data.categories.find((category) => category.slug === slug) ?? null;
    },

    async getAttributeSet(id) {
      return data.attributeSets.find((set) => set.id === id) ?? null;
    },

    async listBrands() {
      return [...data.brands].sort((a, b) => a.name.localeCompare(b.name));
    },

    async getBrand(slug) {
      return data.brands.find((brand) => brand.slug === slug) ?? null;
    },

    async listProducts(query = {}) {
      const empty = paginate<Product>([], query);
      let products = published();

      if (query.category) {
        const category = data.categories.find((candidate) => candidate.slug === query.category);
        if (!category) return empty;
        const ids = withDescendants([category.id], data.categories);
        products = products.filter((product) => ids.has(product.categoryId));
      }
      if (query.brand) {
        const brand = data.brands.find((candidate) => candidate.slug === query.brand);
        if (!brand) return empty;
        products = products.filter((product) => product.brandId === brand.id);
      }
      if (query.collection) {
        const collection = data.collections.find(
          (candidate) => candidate.slug === query.collection,
        );
        if (!collection) return empty;
        products = products.filter((product) => inCollection(product, collection));
      }

      const sorted = products
        .filter((product) => matchesSearch(searchFields(product), query.search))
        .filter(
          (product) => query.minPrice === undefined || productFromPrice(product) >= query.minPrice,
        )
        .filter(
          (product) => query.maxPrice === undefined || productFromPrice(product) <= query.maxPrice,
        )
        .filter((product) => !query.inStock || isAvailable(product))
        .filter((product) =>
          (query.attributes ?? []).every((filter) => hasAttribute(product, filter)),
        )
        .sort(PRODUCT_SORTS[query.sort ?? "popular"]);
      return paginate(sorted, query, 12);
    },

    async getProduct(slug) {
      return published().find((product) => product.slug === slug) ?? null;
    },

    async listCollections() {
      return byAdminOrder(data.collections);
    },

    async getCollection(slug) {
      return data.collections.find((collection) => collection.slug === slug) ?? null;
    },

    async listDeals(now) {
      return data.deals
        .filter((deal) => Date.parse(deal.endsAt) > now.getTime())
        .flatMap((deal): DealWithProduct[] => {
          const product = published().find((candidate) => candidate.id === deal.productId);
          const variant = product?.variants.find((candidate) => candidate.id === deal.variantId);
          return product && variant ? [{ ...deal, product }] : [];
        })
        .sort((a, b) => a.endsAt.localeCompare(b.endsAt));
    },

    async listStoreRows() {
      return byAdminOrder(data.storeRows.filter((row) => row.enabled));
    },

    async listCompatibleModels(brand) {
      return data.compatibleModels
        .filter((model) => !brand || model.brand.toLowerCase() === brand.toLowerCase())
        .sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
    },

    async findCompatibleProducts(query) {
      const modelIds =
        "modelId" in query
          ? new Set([query.modelId])
          : new Set(
              data.compatibleModels
                .filter((model) =>
                  model.partCodes.some(
                    (code) => normalizeCode(code) === normalizeCode(query.partCode),
                  ),
                )
                .map((model) => model.id),
            );
      return published()
        .filter((product) => product.compatibleModelIds.some((id) => modelIds.has(id)))
        .sort(PRODUCT_SORTS.popular);
    },

    async findCoupon(code, now) {
      const wanted = code.trim().toUpperCase();
      return (
        data.coupons.find(
          (coupon) => coupon.code === wanted && coupon.enabled && isScheduledNow(coupon, now),
        ) ?? null
      );
    },
  };
}
