import { Suspense } from "react";
import type { Metadata } from "next";
import { Printer, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@waafa/shared";
import { EmptyState } from "@/components/feedback/EmptyState";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ListingHeader } from "@/components/shop/ListingHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { getContactSettings, getSiteSettings } from "@/lib/data/settings";
import { findCompatibleProducts, listCompatibleModels, listDeals } from "@/lib/data/shop";
import { brandNames } from "@/lib/shop/catalogue";
import { withDeals } from "@/lib/shop/deals";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Shop.finder");
  return { title: t("title"), description: t("lead"), alternates: { canonical: "/shop/finder" } };
}

const selectClass =
  "h-12 w-full rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20";
const labelClass = "flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900";

async function FinderContent({
  searchParams,
}: Pick<PageProps<"/[locale]/shop/finder">, "searchParams">) {
  const params = await searchParams;
  const pick = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string).trim().slice(0, 60) : "";
  const brand = pick("brand");
  const modelId = pick("model");
  const part = pick("part");
  const [allModels, contact, names, deals, t] = await Promise.all([
    listCompatibleModels(),
    getContactSettings(),
    brandNames(),
    listDeals(),
    getTranslations("Shop.finder"),
  ]);
  const brands = [...new Set(allModels.map((model) => model.brand))];
  const models = brand ? allModels.filter((model) => model.brand === brand) : [];
  const model = allModels.find((item) => item.id === modelId);
  const query = model ? { modelId: model.id } : part ? { partCode: part } : null;
  const results = query
    ? (await findCompatibleProducts(query)).map((product) => withDeals(product, deals))
    : null;
  const modelName = model ? `${model.brand} ${model.model}` : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form
          method="get"
          className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-5"
        >
          <h2 className="flex items-center gap-2 font-display text-[18px] font-bold text-navy-900">
            <Printer aria-hidden="true" className="size-5 text-brand-700" />
            {t("title")}
          </h2>
          <label className={labelClass}>
            {t("brand")}
            <select name="brand" defaultValue={brand} className={selectClass}>
              <option value="">{t("chooseBrand")}</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {models.length > 0 ? (
            <label className={labelClass}>
              {t("model")}
              <select name="model" defaultValue={modelId} className={selectClass}>
                <option value="">{t("chooseModel")}</option>
                {models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.model}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button type="submit">{t("show")}</Button>
        </form>
        <form method="get" className="flex flex-col gap-4 rounded-2xl bg-mist-50 p-5">
          <h2 className="font-display text-[18px] font-bold text-navy-900">{t("partTitle")}</h2>
          <label className={labelClass}>
            {t("partLabel")}
            <input
              name="part"
              defaultValue={part}
              placeholder={t("partPlaceholder")}
              autoComplete="off"
              className={selectClass}
            />
          </label>
          <Button type="submit" variant="navy">
            {t("partSearch")}
          </Button>
        </form>
      </div>

      {results ? (
        results.length > 0 ? (
          <section aria-labelledby="finder-results" className="flex flex-col gap-4">
            <h2 id="finder-results" className="font-display text-[20px] font-bold text-navy-900">
              {model
                ? t("results", { count: results.length, model: modelName })
                : t("partResults", { count: results.length, code: part })}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} brandName={names.get(product.brandId) ?? ""} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <EmptyState
            icon={SearchX}
            title={t("noneTitle")}
            description={t("noneBody")}
            action={
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(
                    contact.whatsappE164,
                    `${t("noneMessage")}${modelName || part}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-5" />
                  {t("noneWhatsapp")}
                </a>
              </Button>
            }
          />
        )
      ) : null}
    </div>
  );
}

/** /shop/finder (ShopFinder, -part, -none, ShopFinder-m; FR-SHOP-05): brand → model → what fits, or a part code. */
export default async function FinderPage({ searchParams }: PageProps<"/[locale]/shop/finder">) {
  const [site, t] = await Promise.all([getSiteSettings(), getTranslations("Shop.finder")]);
  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <ListingHeader
        crumbs={[{ label: site.storeName, href: "/shop" }, { label: t("title") }]}
        title={t("title")}
        lead={t("lead")}
      />
      <Suspense fallback={<Skeleton className="h-[320px] rounded-2xl" />}>
        <FinderContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
