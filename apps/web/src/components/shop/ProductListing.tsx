import { PackageSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatTaka, whatsappLink, type Attribute } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterDisclosure } from "@/components/forms/FilterDisclosure";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getContactSettings } from "@/lib/data/settings";
import { listBrands } from "@/lib/data/shop";
import type { ProductQuery, ProductSort } from "@/lib/data/types";
import { brandNames, pricedProducts } from "@/lib/shop/catalogue";
import { BulkQuote } from "./BulkQuote";
import { ProductCard } from "./ProductCard";

type Params = Record<string, string | string[] | undefined>;

type ProductListingProps = {
  /** The fixed part of the listing: a category, brand, collection or search. */
  base: Pick<ProductQuery, "category" | "brand" | "collection" | "search">;
  params: Params;
  /** Where filter links point, e.g. "/shop/c/toner-cartridges". */
  path: string;
  /** The category's filterable select attributes (FR-CAT-02). */
  attributes?: Attribute[];
  /** Hidden inputs the form must keep, e.g. the search query. */
  keep?: Record<string, string>;
};

const PAGE = 12;
const SORTS: ProductSort[] = ["popular", "price-asc", "price-desc", "newest"];
const PRICE_BANDS = {
  any: [undefined, undefined],
  "under-1000": [undefined, 1000],
  "1000-3000": [1000, 3000],
  "3000-10000": [3000, 10000],
  "over-10000": [10000, undefined],
} as const;
type PriceBand = keyof typeof PRICE_BANDS;

const one = (params: Params, key: string) =>
  typeof params[key] === "string" ? (params[key] as string) : undefined;

const selectClass =
  "h-12 w-full rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20";
const labelClass = "flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900";

/**
 * Product listing (ShopList boards, FR-SHOP-02): a plain GET filter form (brand, price, availability and the
 * category's attributes), sort, the count, product cards, Load more and an empty state with WhatsApp sourcing.
 */
async function ProductListing({
  base,
  params,
  path,
  attributes = [],
  keep = {},
}: ProductListingProps) {
  const sortParam = one(params, "sort") as ProductSort | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "popular";
  const band = (one(params, "price") ?? "any") as PriceBand;
  const [minPrice, maxPrice] = PRICE_BANDS[band] ?? PRICE_BANDS.any;
  const brand = base.brand ? undefined : one(params, "brand");
  const inStock = one(params, "stock") === "in";
  const limit = Math.min(96, Math.max(PAGE, Number(one(params, "limit")) || PAGE));
  const chosen = attributes
    .map((attribute) => ({ attribute, value: one(params, `a.${attribute.key}`) }))
    .filter((item): item is { attribute: Attribute; value: string } => Boolean(item.value));

  const [page, everything, brands, names, contact, t] = await Promise.all([
    pricedProducts({
      ...base,
      ...(brand ? { brand } : {}),
      ...(minPrice !== undefined ? { minPrice } : {}),
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      ...(inStock ? { inStock } : {}),
      ...(chosen.length > 0
        ? {
            attributes: chosen.map(({ attribute, value }) => ({
              key: attribute.key,
              label: attribute.label,
              values: [value],
            })),
          }
        : {}),
      sort,
      limit,
    }),
    pricedProducts({ ...base, limit: 200 }),
    listBrands(),
    brandNames(),
    getContactSettings(),
    getTranslations("Shop"),
  ]);
  const brandOptions = brands.filter((item) =>
    everything.items.some((product) => product.brandId === item.id),
  );
  const active = [brand, band !== "any", inStock, ...chosen].filter(Boolean).length;
  const query = (extra: Record<string, string>) =>
    new URLSearchParams(
      Object.entries({
        ...keep,
        ...(brand ? { brand } : {}),
        ...(band !== "any" ? { price: band } : {}),
        ...(inStock ? { stock: "in" } : {}),
        ...Object.fromEntries(chosen.map(({ attribute, value }) => [`a.${attribute.key}`, value])),
        ...(sort !== "popular" ? { sort } : {}),
        ...extra,
      }),
    ).toString();
  const priceLabel = (value: PriceBand) => {
    const [min, max] = PRICE_BANDS[value];
    if (min === undefined && max === undefined) return t("list.priceAny");
    if (min === undefined) return t("list.priceUnder", { max: formatTaka(max ?? 0) });
    if (max === undefined) return t("list.priceOver", { min: formatTaka(min) });
    return t("list.priceBetween", { min: formatTaka(min), max: formatTaka(max) });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-8">
      <aside aria-label={t("list.filters")}>
        <FilterDisclosure label={t("list.filters")} count={active}>
          <form
            method="get"
            action={path}
            className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-4"
          >
            {Object.entries(keep).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            {!base.brand && brandOptions.length > 1 ? (
              <label className={labelClass}>
                {t("list.brand")}
                <select name="brand" defaultValue={brand ?? ""} className={selectClass}>
                  <option value="">{t("list.anyBrand")}</option>
                  {brandOptions.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className={labelClass}>
              {t("list.price")}
              <select name="price" defaultValue={band} className={selectClass}>
                {(Object.keys(PRICE_BANDS) as PriceBand[]).map((value) => (
                  <option key={value} value={value}>
                    {priceLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            {attributes.map((attribute) => (
              <label key={attribute.key} className={labelClass}>
                {attribute.label}
                <select
                  name={`a.${attribute.key}`}
                  defaultValue={one(params, `a.${attribute.key}`) ?? ""}
                  className={selectClass}
                >
                  <option value="">{t("list.any")}</option>
                  {(attribute.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-[14px] font-semibold text-ink-900">
                {t("list.availability")}
              </legend>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink-900">
                <input
                  type="checkbox"
                  name="stock"
                  value="in"
                  defaultChecked={inStock}
                  className="size-5 accent-electric-600"
                />
                {t("list.inStockOnly")}
              </label>
            </fieldset>
            <label className={labelClass}>
              {t("list.sort")}
              <select name="sort" defaultValue={sort} className={selectClass}>
                {SORTS.map((value) => (
                  <option key={value} value={value}>
                    {t(`list.sorts.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">{t("list.apply")}</Button>
            {active > 0 ? (
              <Link
                href={keep.q ? `${path}?${new URLSearchParams(keep).toString()}` : path}
                className="self-center text-[14px] font-semibold text-brand-700 underline underline-offset-4"
              >
                {t("list.clear")}
              </Link>
            ) : null}
          </form>
        </FilterDisclosure>
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[18px] font-bold text-navy-900">
            {t("list.count", { count: page.total })}
          </h2>
          {page.items.some((product) => product.sample) ? (
            <SampleBadge label={t("list.sample")} />
          ) : null}
        </div>
        {page.items.length > 0 ? (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {page.items.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} brandName={names.get(product.brandId) ?? ""} />
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[14px] text-mist-600">
                {t("list.showing", { shown: page.items.length, total: page.total })}
              </p>
              {page.items.length < page.total ? (
                <Button asChild variant="secondary">
                  <Link href={`${path}?${query({ limit: String(limit + PAGE) })}`} scroll={false}>
                    {t("list.loadMore")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <EmptyState
            icon={PackageSearch}
            title={t("list.emptyTitle")}
            description={t("list.emptyBody")}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {active > 0 ? (
                  <Button asChild variant="secondary">
                    <Link href={path}>{t("list.emptyClear")}</Link>
                  </Button>
                ) : null}
                <Button asChild variant="whatsapp">
                  <a
                    href={whatsappLink(
                      contact.whatsappE164,
                      `${t("list.emptyMessage")}${keep.q ?? ""}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon className="size-5" />
                    {t("list.emptyWhatsapp")}
                  </a>
                </Button>
              </div>
            }
          />
        )}
        <div className="flex flex-col gap-3 rounded-2xl bg-mist-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="block text-[15px] font-semibold text-navy-900">
              {t("list.bulkTitle")}
            </span>
            <span className="block text-[14px] text-mist-700">{t("list.bulkBody")}</span>
          </p>
          <BulkQuote trigger={<Button variant="navy">{t("list.bulkCta")}</Button>} />
        </div>
      </div>
    </div>
  );
}

export { ProductListing };
