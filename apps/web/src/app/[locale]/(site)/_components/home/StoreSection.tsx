import { ArrowRight, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { HomeContent, HomeSection } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { ProductCard } from "@/components/shop/ProductCard";
import { getMenu, getSiteSettings } from "@/lib/data/settings";
import { listBrands, listCategories, listProducts } from "@/lib/data/shop";
import { Link } from "@/i18n/navigation";
import { HomeSectionShell } from "./HomeSectionShell";
import { SnapRow } from "./SnapRow";

type StoreSectionProps = { section: HomeSection; store: HomeContent["store"] };

/**
 * Waafas World band (FR-HOME 9): the store name as text (never a second logo), what it sells, the perks, top
 * categories, the two Waafa International services and this week's best sellers.
 */
async function StoreSection({ section, store }: StoreSectionProps) {
  const [site, panel, categories, products, brands, t] = await Promise.all([
    getSiteSettings(),
    getMenu("shop-panel"),
    listCategories(),
    listProducts({ sort: "popular", limit: 4 }),
    listBrands(),
    getTranslations("Home.store"),
  ]);
  const top = categories.filter((category) => category.level === 1).slice(0, 6);
  const services = panel.items.filter((item) => item.visible && item.href);
  const brandName = (id: string) => brands.find((brand) => brand.id === id)?.name;

  return (
    <HomeSectionShell labelledBy="home-store">
      <div className="grid grid-cols-1 gap-6 overflow-hidden rounded-[28px] bg-mist-50 p-5 md:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:p-10">
        <div className="flex flex-col gap-4">
          <p className="type-label text-brand-700">{section.kicker || site.storeName}</p>
          <h2 id="home-store" className="type-h2 text-navy-900">
            {section.title || store.title}
          </h2>
          <p className="type-lead text-mist-600">{section.subtitle || store.body}</p>
          {store.perks.length > 0 ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {store.perks.map((perk) => (
                <li
                  key={perk}
                  className="flex items-center gap-2 text-[14.5px] font-medium text-ink-900"
                >
                  <Check aria-hidden="true" className="size-4 text-success-600" />
                  {perk}
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href="/shop"
            className="mt-2 inline-flex h-12 items-center gap-2 self-start rounded-full bg-navy-900 px-6 text-[15px] font-semibold text-white outline-none hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {t("open")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="flex flex-col gap-5">
          {top.length > 0 ? (
            <div>
              <h3 className="mb-3 text-[13.5px] font-semibold text-mist-700">{t("categories")}</h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {top.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/shop/c/${category.slug}`}
                      className="flex min-h-14 items-center gap-2.5 rounded-xl border border-mist-200 bg-white px-3 text-[13.5px] leading-tight font-medium text-ink-900 outline-none hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <MenuIcon
                        name={category.icon}
                        className="size-[18px] shrink-0 text-brand-700"
                      />
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h3 className="mb-3 text-[13.5px] font-semibold text-mist-700">{t("services")}</h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={service.href ?? "/shop"}
                    className="flex min-h-14 items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-mist-200 outline-none hover:ring-electric-200 focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    <MenuIcon name={service.icon} className="size-5 shrink-0 text-brand-700" />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-ink-900">
                        {service.label}
                      </span>
                      {service.cta ? (
                        <span className="block text-[12.5px] text-mist-600">{service.cta}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {products.items.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-[19px] font-bold text-navy-900">{t("bestSellers")}</h3>
          <SnapRow className="lg:grid-cols-4" itemClassName="w-[58%] sm:w-[36%]">
            {products.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                brandName={brandName(product.brandId)}
              />
            ))}
          </SnapRow>
        </div>
      ) : null}
    </HomeSectionShell>
  );
}

export { StoreSection };
