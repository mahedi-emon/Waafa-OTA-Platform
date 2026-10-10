import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ArrowRight, Building2, Printer } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink, type Product, type StoreRow } from "@waafa/shared";
import { SectionHeading } from "@/components/content/SectionHeading";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SmartImage } from "@/components/media/SmartImage";
import { BulkQuote } from "@/components/shop/BulkQuote";
import { DealCountdown } from "@/components/shop/DealCountdown";
import { ProductCard } from "@/components/shop/ProductCard";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { Canonical } from "@/components/seo/Canonical";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getMediaSlot, listBanners } from "@/lib/data/content";
import { getContactSettings, getShopContent, getSiteSettings } from "@/lib/data/settings";
import {
  listBrands,
  listCategories,
  listCollections,
  listDeals,
  listProducts,
  listStoreRows,
} from "@/lib/data/shop";
import { brandNames, pricedProducts } from "@/lib/shop/catalogue";
import { withDeals } from "@/lib/shop/deals";
import { CampaignCarousel } from "./_components/CampaignCarousel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Shop");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5";
const ROW = 5;

/** Row heading: the admin title and lead win over the defaults. */
function heading(row: StoreRow, fallbackTitle: string, fallbackLead?: string) {
  return { title: row.title || fallbackTitle, subtitle: row.subtitle || fallbackLead };
}

/**
 * /shop (Shop, Shop-m boards; FR-SHOP-01): rows ordered and switched in admin, each hidden when it has nothing to
 * show: campaigns with the bulk and finder strips, categories, collections, deals, best sellers, brands, new
 * arrivals, recently viewed, services, the corporate band and the trust row.
 */
export default async function ShopPage() {
  const [rows, t, site, content, contact, names] = await Promise.all([
    listStoreRows(),
    getTranslations("Shop"),
    getSiteSettings(),
    getShopContent(),
    getContactSettings(),
    brandNames(),
  ]);
  const card = (product: Product) => (
    <li key={product.id}>
      <ProductCard product={product} brandName={names.get(product.brandId) ?? ""} />
    </li>
  );

  const renderers: Record<StoreRow["key"], (row: StoreRow) => Promise<ReactNode>> = {
    campaigns: async () => {
      const [banners, categories] = await Promise.all([listBanners("shop-hero"), listCategories()]);
      const finderOn = categories.some((category) => category.compatibility);
      if (banners.length === 0) return null;
      return (
        <section
          aria-label={t("home.campaignsLabel")}
          className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          <CampaignCarousel
            banners={banners}
            labels={{
              region: t("home.campaignsLabel"),
              previous: t("home.previous"),
              next: t("home.next"),
              sample: t("home.sample"),
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="flex flex-col justify-between gap-3 rounded-[24px] bg-mist-50 p-6">
              <Building2 aria-hidden="true" className="size-7 text-brand-700" />
              <div>
                <h2 className="font-display text-[19px] font-bold text-navy-900">
                  {content.bulkStrip.title}
                </h2>
                <p className="text-[14.5px] text-mist-700">{content.bulkStrip.body}</p>
              </div>
              <BulkQuote
                trigger={
                  <Button variant="navy" className="self-start">
                    {content.bulkStrip.cta}
                  </Button>
                }
              />
            </div>
            {finderOn ? (
              <Link
                href="/shop/finder"
                className="group flex flex-col justify-between gap-3 rounded-[24px] bg-navy-900 p-6 text-white outline-none focus-visible:ring-3 focus-visible:ring-cyan-400/60"
              >
                <Printer aria-hidden="true" className="size-7 text-cyan-400" />
                <span>
                  <span className="block font-display text-[19px] font-bold">
                    {content.finderStrip.title}
                  </span>
                  <span className="block text-[14.5px] text-white/80">
                    {content.finderStrip.body}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold">
                  {content.finderStrip.cta}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            ) : null}
          </div>
        </section>
      );
    },
    categories: async (row) => {
      // Categories open on the store home once they hold products (FR-CAT-06).
      const top = (await listCategories()).filter((category) => category.level === 1);
      const totals = await Promise.all(
        top.map((category) => listProducts({ category: category.slug, limit: 1 })),
      );
      const categories = top.filter((_, index) => (totals[index]?.total ?? 0) > 0);
      const counts = totals.filter((page) => page.total > 0);
      if (categories.length === 0) return null;
      const { title, subtitle } = heading(row, t("home.categories"));
      return (
        <section aria-labelledby="store-categories" className="flex flex-col gap-5">
          <SectionHeading
            id="store-categories"
            title={title}
            {...(subtitle ? { subtitle } : {})}
            action={{ href: "/shop/categories", label: t("home.allCategories") }}
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, index) => (
              <li key={category.id}>
                <Link
                  href={`/shop/c/${category.slug}`}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4 outline-none hover:border-electric-200 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-electric-50 text-brand-700">
                    <MenuIcon name={category.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold text-navy-900">
                      {category.name}
                    </span>
                    <span className="block text-[12.5px] text-mist-600">
                      {t("home.collectionCount", { count: counts[index]?.total ?? 0 })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      );
    },
    collections: async (row) => {
      const collections = await listCollections();
      const counts = await Promise.all(
        collections.map((item) => listProducts({ collection: item.slug, limit: 1 })),
      );
      const shown = collections.filter((_, index) => (counts[index]?.total ?? 0) > 0);
      if (shown.length === 0) return null;
      const { title, subtitle } = heading(row, t("home.collections"), t("home.collectionsLead"));
      return (
        <section aria-labelledby="store-collections" className="flex flex-col gap-5">
          <SectionHeading
            id="store-collections"
            title={title}
            {...(subtitle ? { subtitle } : {})}
          />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/shop/collection/${collection.slug}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-navy-900 p-5 text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {collection.image ? (
                    <SmartImage
                      src={collection.image.src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover opacity-75 transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent"
                  />
                  <span className="relative">
                    <span className="block font-display text-[19px] font-bold">
                      {collection.name}
                    </span>
                    <span className="block text-[13px] text-white/80">
                      {t("home.collectionCount", {
                        count: counts[collections.indexOf(collection)]?.total ?? 0,
                      })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      );
    },
    deals: async (row) => {
      const deals = await listDeals();
      if (deals.length === 0) return null;
      const soonest = deals[0];
      const { title, subtitle } = heading(row, t("home.deals"), t("home.dealsLead"));
      return (
        <section
          aria-labelledby="store-deals"
          className="flex flex-col gap-5 rounded-[24px] bg-mist-50 p-5 md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading id="store-deals" title={title} {...(subtitle ? { subtitle } : {})} />
            {soonest ? (
              <DealCountdown
                endsAt={soonest.endsAt}
                labels={{
                  days: t("countdown.days"),
                  hours: t("countdown.hours"),
                  minutes: t("countdown.minutes"),
                  seconds: t("countdown.seconds"),
                  ended: t("countdown.ended"),
                  label: t("countdown.label"),
                }}
              />
            ) : null}
          </div>
          <ul className={GRID}>{deals.map((deal) => card(withDeals(deal.product, deals)))}</ul>
          <Link
            href="/shop/deals"
            className="self-start text-[15px] font-semibold text-brand-700 underline underline-offset-4"
          >
            {t("home.allDeals")}
          </Link>
        </section>
      );
    },
    bestSellers: async (row) => {
      const products = await pricedProducts({ sort: "popular", limit: ROW });
      if (products.items.length === 0) return null;
      const { title, subtitle } = heading(row, t("home.bestSellers"), t("home.bestSellersLead"));
      return (
        <section aria-labelledby="store-best" className="flex flex-col gap-5">
          <SectionHeading
            id="store-best"
            title={title}
            {...(subtitle ? { subtitle } : {})}
            action={{ href: "/shop/search?sort=popular", label: t("home.seeAll") }}
          />
          <ul className={GRID}>{products.items.map(card)}</ul>
        </section>
      );
    },
    brands: async (row) => {
      const brands = await listBrands();
      const counts = await Promise.all(
        brands.map((brand) => listProducts({ brand: brand.slug, limit: 1 })),
      );
      const shown = brands.filter((_, index) => (counts[index]?.total ?? 0) > 0);
      if (shown.length === 0) return null;
      const { title, subtitle } = heading(row, t("home.brands"), t("home.brandsLead"));
      return (
        <section aria-labelledby="store-brands" className="flex flex-col gap-5">
          <SectionHeading id="store-brands" title={title} {...(subtitle ? { subtitle } : {})} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((brand) => (
              <li key={brand.id}>
                <Link
                  href={`/shop/brand/${brand.slug}`}
                  className="flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-2xl border border-mist-200 bg-white px-3 py-4 text-center outline-none hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <span className="font-display text-[16px] font-extrabold text-navy-900">
                    {brand.name}
                  </span>
                  <span className="text-[12.5px] text-mist-600">
                    {t("home.brandCount", { count: counts[brands.indexOf(brand)]?.total ?? 0 })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      );
    },
    newArrivals: async (row) => {
      const products = await pricedProducts({ sort: "newest", limit: ROW });
      if (products.items.length === 0) return null;
      const { title, subtitle } = heading(row, t("home.newArrivals"), t("home.newArrivalsLead"));
      return (
        <section aria-labelledby="store-new" className="flex flex-col gap-5">
          <SectionHeading
            id="store-new"
            title={title}
            {...(subtitle ? { subtitle } : {})}
            action={{ href: "/shop/search?sort=newest", label: t("home.seeAll") }}
          />
          <ul className={GRID}>{products.items.map(card)}</ul>
        </section>
      );
    },
    recentlyViewed: async (row) => (
      <RecentlyViewed title={row.title || t("home.recentlyViewed")} clearLabel={t("home.clear")} />
    ),
    services: async (row) => {
      if (content.services.length === 0) return null;
      const slots = await Promise.all(
        content.services.map((service) => getMediaSlot(service.mediaSlot)),
      );
      const { title, subtitle } = heading(row, t("home.services"), t("home.servicesLead"));
      return (
        <section aria-labelledby="store-services" className="flex flex-col gap-5">
          <SectionHeading id="store-services" title={title} {...(subtitle ? { subtitle } : {})} />
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {content.services.map((service, index) => {
              const image = slots[index]?.image ?? slots[index]?.video?.poster;
              return (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="group grid h-full grid-cols-1 overflow-hidden rounded-2xl border border-mist-200 bg-white outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40 sm:grid-cols-[200px_1fr]"
                  >
                    {image ? (
                      <SmartImage
                        src={image.src}
                        alt={image.alt}
                        ratio="16/10"
                        sizes="(min-width: 640px) 200px, 100vw"
                        className="sm:h-full"
                      />
                    ) : null}
                    <span className="flex flex-col gap-1.5 p-5">
                      <span className="font-display text-[18px] font-bold text-navy-900">
                        {service.title}
                      </span>
                      <span className="text-[13px] font-semibold text-brand-700">
                        {service.sub}
                      </span>
                      <span className="text-[14.5px] text-mist-700">{service.body}</span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-brand-700">
                        {service.cta}
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      );
    },
    bulkBanner: async () => (
      <section
        aria-labelledby="store-corporate"
        className="grid grid-cols-1 gap-6 rounded-[24px] bg-navy-900 p-6 text-white md:p-10 lg:grid-cols-[1.1fr_1fr]"
      >
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-bold tracking-[0.14em] text-cyan-400 uppercase">
            {content.corporate.kicker}
          </p>
          <h2
            id="store-corporate"
            className="font-display text-[26px] leading-tight font-extrabold md:text-[32px]"
          >
            {content.corporate.title}
          </h2>
          <p className="text-[15px] text-white/80">{content.corporate.body}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <BulkQuote trigger={<Button variant="white">{t("home.corporateCta")}</Button>} />
            <Button asChild variant="glass">
              <a
                href={whatsappLink(contact.whatsappE164, t("home.corporateMessage"))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon className="size-5" />
                {t("home.corporateWhatsapp")}
              </a>
            </Button>
          </div>
        </div>
        <ol className="flex flex-col gap-3">
          {content.corporate.steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl bg-white/8 p-4">
              <span className="font-display text-[15px] font-extrabold text-cyan-400 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{step.title}</span>
                <span className="block text-[14px] text-white/75">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    ),
    trust: async () =>
      content.trust.length > 0 ? (
        <section aria-label={t("home.trust")}>
          <ul className="grid grid-cols-1 gap-3 rounded-[24px] border border-mist-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.trust.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-50 text-success-600">
                  <MenuIcon name={item.icon} className="size-5" />
                </span>
                <span>
                  <span className="block text-[14.5px] font-semibold text-navy-900">
                    {item.title}
                  </span>
                  <span className="block text-[13px] text-mist-600">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null,
  };
  const sections = await Promise.all(rows.map((row) => renderers[row.key](row)));

  return (
    <main id="main" className="site-container flex flex-col gap-12 pt-5 pb-28 md:pt-6">
      <Canonical path="/shop" />
      <h1 className="sr-only">{site.storeName}</h1>
      {sections.map((section, index) =>
        section ? <div key={rows[index]?.key}>{section}</div> : null,
      )}
    </main>
  );
}
