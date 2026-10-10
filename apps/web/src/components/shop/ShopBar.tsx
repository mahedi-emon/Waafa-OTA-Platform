import { Gauge, LayoutGrid, Printer } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getShopContent, getSiteSettings } from "@/lib/data/settings";
import { listBrands, listCategories, listProducts } from "@/lib/data/shop";
import { CartButton } from "./CartButton";
import { ShopSearchBox, type SearchEntry } from "./ShopSearchBox";

/**
 * Store bar under the site header (Shop, Shop-suggest): "Waafas World" as text beside the one WAAFA logo in the header
 * (never a second mark), product search with suggestions, quick links and the cart with its count.
 */
async function ShopBar() {
  const [t, site, content, categories, brands, products] = await Promise.all([
    getTranslations("Shop.bar"),
    getSiteSettings(),
    getShopContent(),
    listCategories(),
    listBrands(),
    listProducts({ limit: 100 }),
  ]);
  const brandName = new Map(brands.map((brand) => [brand.id, brand.name]));
  const entries: SearchEntry[] = [
    ...products.items.map((product) => ({
      kind: "product" as const,
      label: product.title,
      sub: brandName.get(product.brandId) ?? "",
      href: `/shop/p/${product.slug}`,
    })),
    ...categories.map((category) => ({
      kind: "category" as const,
      label: category.name,
      href: `/shop/c/${category.slug}`,
    })),
    ...brands.map((brand) => ({
      kind: "brand" as const,
      label: brand.name,
      href: `/shop/brand/${brand.slug}`,
    })),
  ];
  const finderOn = categories.some((category) => category.compatibility);

  return (
    <div className="border-b border-mist-200 bg-white">
      <div className="site-container flex flex-col gap-3 py-3 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/shop"
            className="flex flex-col leading-tight outline-none focus-visible:underline"
          >
            <span className="font-display text-[20px] font-extrabold tracking-tight text-navy-900">
              {site.storeName}
            </span>
            <span className="text-[12px] text-mist-600">{content.tagline}</span>
          </Link>
          <div className="md:hidden">
            <CartButton label={t("cart")} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <ShopSearchBox
            entries={entries}
            labels={{
              search: t("search"),
              button: t("searchButton"),
              groups: { product: t("products"), category: t("categories"), brand: t("brands") },
              noSuggestions: t("noSuggestions"),
            }}
          />
        </div>
        <nav
          aria-label={site.storeName}
          className="-mx-1 flex items-center gap-1 overflow-x-auto md:mx-0"
        >
          {[
            { href: "/shop/categories", label: t("allCategories"), icon: LayoutGrid },
            { href: "/shop/deals", label: t("deals"), icon: Gauge },
            ...(finderOn ? [{ href: "/shop/finder", label: t("finder"), icon: Printer }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-ink-900 outline-none hover:bg-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <item.icon aria-hidden="true" className="size-4 text-brand-700" />
              {item.label}
            </Link>
          ))}
          <div className="ml-1 hidden md:block">
            <CartButton label={t("cart")} />
          </div>
        </nav>
      </div>
    </div>
  );
}

export { ShopBar };
