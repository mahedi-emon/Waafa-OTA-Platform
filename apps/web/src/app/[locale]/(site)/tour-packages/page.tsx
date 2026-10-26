import { Suspense } from "react";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { Search } from "@/components/icons/serverIcons";
import { getTranslations } from "next-intl/server";
import { PackageCategorySchema, type PackageCategory } from "@waafa/shared";
import { cn } from "cn";
import { BannerHero } from "@/components/content/BannerHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FilterDisclosure } from "@/components/forms/FilterDisclosure";
import { FilterForm } from "@/components/forms/FilterForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PackageCard } from "@/components/travel/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { getMediaSlot } from "@/lib/data/content";
import { listPackages } from "@/lib/data/travel";
import type { PackageSort } from "@/lib/data/types";
import { formatMonth } from "@/lib/search/isoDate";
import { withSocial } from "@/lib/seo/withSocial";
import { ItemListJsonLd } from "@/components/seo/ItemListJsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Packages");
  return withSocial({
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/tour-packages" },
  });
}

const LENGTHS = {
  any: [undefined, undefined],
  short: [undefined, 3],
  mid: [4, 6],
  long: [7, undefined],
} as const;
const BUDGETS = {
  any: [undefined, undefined],
  "under-25000": [undefined, 25000],
  "25000-75000": [25000, 75000],
  "75000-150000": [75000, 150000],
  "over-150000": [150000, undefined],
} as const;
const SORTS: PackageSort[] = ["popular", "price-asc", "price-desc", "shortest"];
const PAGE = 9;

type Params = Record<string, string | string[] | undefined>;
const one = (params: Params, key: string) =>
  typeof params[key] === "string" ? (params[key] as string) : undefined;

const selectClass =
  "h-12 w-full rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20";
const labelClass = "flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900";
const legendClass = "mb-1 text-[14px] font-semibold text-ink-900";
const radioClass =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-[14.5px] text-ink-700 transition-colors duration-150 hover:bg-mist-50 has-checked:font-semibold has-checked:text-navy-900";

/** "/tour-packages?…" for a set of filters, leaving out empty and default values. */
function packagesHref(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams(
    Object.entries(values).filter(
      (entry): entry is [string, string] =>
        Boolean(entry[1]) && entry[1] !== "any" && !(entry[0] === "sort" && entry[1] === "popular"),
    ),
  );
  const search = params.toString();
  return search ? `/tour-packages?${search}` : "/tour-packages";
}

async function PackageResults({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const search = one(params, "search")?.slice(0, 80) ?? "";
  const destination = one(params, "destination") || undefined;
  const categoryParam = one(params, "category");
  const category = PackageCategorySchema.safeParse(categoryParam).success
    ? (categoryParam as PackageCategory)
    : undefined;
  const length = (one(params, "length") ?? "any") as keyof typeof LENGTHS;
  const budget = (one(params, "budget") ?? "any") as keyof typeof BUDGETS;
  const month = /^\d{4}-\d{2}$/.test(one(params, "month") ?? "") ? one(params, "month") : undefined;
  const sort = SORTS.includes(one(params, "sort") as PackageSort)
    ? (one(params, "sort") as PackageSort)
    : "popular";
  const limit = Math.min(60, Math.max(PAGE, Number(one(params, "limit")) || PAGE));
  const [minNights, maxNights] = LENGTHS[length] ?? LENGTHS.any;
  const [minPrice, maxPrice] = BUDGETS[budget] ?? BUDGETS.any;

  const [page, everything, t] = await Promise.all([
    listPackages({
      ...(search ? { search } : {}),
      ...(destination ? { destination } : {}),
      ...(category ? { category } : {}),
      ...(minNights !== undefined ? { minNights } : {}),
      ...(maxNights !== undefined ? { maxNights } : {}),
      ...(minPrice !== undefined ? { minPrice } : {}),
      ...(maxPrice !== undefined ? { maxPrice } : {}),
      ...(month ? { month } : {}),
      sort,
      limit,
    }),
    listPackages({ limit: 100 }),
    getTranslations("Packages"),
  ]);
  const destinations = [
    ...new Map(
      everything.items.map((p) => [p.destinationSlug, p.countries[0] ?? p.destinationSlug]),
    ).entries(),
  ];
  const months = [...new Set(everything.items.flatMap((p) => p.months))].sort();
  const categories = PackageCategorySchema.options
    .map((value) => ({
      value,
      count: everything.items.filter((p) => p.categories.includes(value)).length,
    }))
    .filter((item) => item.count > 0);
  const active = [destination, length !== "any", budget !== "any", month].filter(Boolean).length;
  const current = {
    search,
    destination,
    category,
    length,
    budget,
    month,
    sort,
  } satisfies Record<string, string | undefined>;
  const more = packagesHref({ ...current, limit: String(limit + PAGE) });

  return (
    <div className="flex flex-col gap-6">
      <ItemListJsonLd
        name={t("list.title")}
        items={page.items.map((pkg) => ({
          name: pkg.title,
          path: `/tour-packages/${pkg.slug}`,
          image: pkg.cover.src,
        }))}
      />
      <nav
        aria-label={t("list.kindsLabel")}
        className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4"
      >
        <ul className="flex w-max gap-2">
          {[{ value: undefined, count: everything.items.length }, ...categories].map((item) => {
            const selected = item.value === category;
            return (
              <li key={item.value ?? "all"}>
                <Link
                  href={packagesHref({ ...current, category: item.value })}
                  scroll={false}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    selected
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-mist-200 bg-white text-ink-900 hover:border-mist-300 hover:bg-mist-50",
                  )}
                >
                  {item.value ? t(`list.categories.${item.value}`) : t("list.allTrips")}
                  <span
                    className={cn(
                      "text-[12px] tabular-nums",
                      selected ? "text-white/70" : "text-mist-500",
                    )}
                  >
                    {item.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
        <aside aria-label={t("list.filters")}>
          <FilterDisclosure label={t("list.filters")} count={active}>
            <FilterForm
              aria-label={t("list.filters")}
              className="flex flex-col gap-5 rounded-2xl border border-mist-200 bg-white p-4"
            >
              {search ? <input type="hidden" name="search" value={search} /> : null}
              {category ? <input type="hidden" name="category" value={category} /> : null}
              {sort !== "popular" ? <input type="hidden" name="sort" value={sort} /> : null}
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-[16px] font-bold text-navy-900">
                  {t("list.filters")}
                </p>
                {active > 0 ? (
                  <Link
                    href={packagesHref({ search, category, sort })}
                    scroll={false}
                    className="inline-flex min-h-11 items-center text-[14px] font-semibold text-brand-700 hover:underline"
                  >
                    {t("list.clear")}
                  </Link>
                ) : null}
              </div>
              <label className={labelClass}>
                {t("list.destination")}
                <select name="destination" defaultValue={destination ?? ""} className={selectClass}>
                  <option value="">{t("list.anyDestination")}</option>
                  {destinations.map(([slug, name]) => (
                    <option key={slug} value={slug}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="flex min-w-0 flex-col">
                <legend className={legendClass}>{t("list.length")}</legend>
                {(Object.keys(LENGTHS) as Array<keyof typeof LENGTHS>).map((value) => (
                  <label key={value} className={radioClass}>
                    <input
                      type="radio"
                      name="length"
                      value={value}
                      defaultChecked={value === length}
                      className="size-4 shrink-0 accent-electric-600"
                    />
                    {t(`list.lengths.${value}`)}
                  </label>
                ))}
              </fieldset>
              <fieldset className="flex min-w-0 flex-col">
                <legend className={legendClass}>{t("list.budget")}</legend>
                {(Object.keys(BUDGETS) as Array<keyof typeof BUDGETS>).map((value) => (
                  <label key={value} className={radioClass}>
                    <input
                      type="radio"
                      name="budget"
                      value={value}
                      defaultChecked={value === budget}
                      className="size-4 shrink-0 accent-electric-600"
                    />
                    {t(`list.budgets.${value}`)}
                  </label>
                ))}
              </fieldset>
              <label className={labelClass}>
                {t("list.month")}
                <select name="month" defaultValue={month ?? ""} className={selectClass}>
                  <option value="">{t("list.anyMonth")}</option>
                  {months.map((value) => (
                    <option key={value} value={value}>
                      {formatMonth(value)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="h-12 cursor-pointer rounded-full bg-primary text-[15px] font-semibold text-primary-foreground outline-none hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {t("list.apply")}
              </button>
            </FilterForm>
          </FilterDisclosure>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div aria-live="polite" className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-mist-700">
                {t("list.count", { count: page.total })}
              </h2>
              {page.items.some((p) => p.sample) ? <SampleBadge label={t("detail.sample")} /> : null}
            </div>
            <nav aria-label={t("list.sort")} className="flex flex-wrap items-center gap-1">
              <span className="mr-1 text-[13.5px] text-mist-600">{t("list.sortLabel")}</span>
              {SORTS.map((value) => (
                <Link
                  key={value}
                  href={packagesHref({ ...current, sort: value })}
                  scroll={false}
                  aria-current={value === sort ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full px-3 text-[13.5px] font-semibold transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    value === sort
                      ? "bg-electric-50 text-brand-700"
                      : "text-mist-700 hover:bg-mist-50 hover:text-navy-900",
                  )}
                >
                  {t(`list.sorts.${value}`)}
                </Link>
              ))}
            </nav>
          </div>
          {page.items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {page.items.map((pkg) => (
                <li key={pkg.id} className="reveal-on-view">
                  <PackageCard
                    pkg={pkg}
                    sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 92vw"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Compass}
              title={t("list.emptyTitle")}
              description={t("list.emptyBody")}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link
                    href="/plan-my-trip"
                    className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-brand-700"
                  >
                    {t("list.emptyPlan")}
                  </Link>
                  <Link
                    href="/tour-packages"
                    className="inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-brand-700 hover:underline"
                  >
                    {t("list.clear")}
                  </Link>
                </div>
              }
            />
          )}
          {page.total > page.items.length ? (
            <Link
              href={more}
              scroll={false}
              className="inline-flex h-12 items-center justify-center self-center rounded-full border border-mist-300 bg-white px-6 text-[15px] font-semibold text-navy-900 hover:bg-mist-50"
            >
              {t("list.loadMore")}
            </Link>
          ) : null}
          <section
            aria-labelledby="plan-cta-title"
            className="mt-4 grid grid-cols-1 gap-4 rounded-[20px] bg-navy-900 p-6 text-white md:grid-cols-[1fr_auto] md:items-center md:p-8"
          >
            <div>
              <h2 id="plan-cta-title" className="type-h3">
                {t("list.planTitle")}
              </h2>
              <p className="mt-1 text-[15px] text-white/80">{t("list.planBody")}</p>
              <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-cyan-400">
                <li>1 · {t("list.planSteps.one")}</li>
                <li>2 · {t("list.planSteps.two")}</li>
                <li>3 · {t("list.planSteps.three")}</li>
              </ol>
            </div>
            <Link
              href="/plan-my-trip"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-[15px] font-semibold text-navy-900 hover:bg-mist-100"
            >
              {t("list.planAction")}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * /tour-packages (Packages, Packages-empty, Packages-m, Packages-m-filters): a photo banner with the search, kinds
 * of trip as chips with counts, filters in the URL (applied on change, no-JS form underneath) and sort links.
 */
export default async function PackagesPage({ searchParams }: PageProps<"/[locale]/tour-packages">) {
  const [t, media] = await Promise.all([
    getTranslations("Packages"),
    getMediaSlot("packages-header"),
  ]);
  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <BannerHero
        id="packages-title"
        kicker={t("breadcrumb")}
        title={t("list.title")}
        lead={t("list.lead")}
        media={media}
        aside={
          <form method="get" role="search" className="flex w-full gap-2 lg:ml-auto lg:max-w-md">
            <label className="sr-only" htmlFor="package-search">
              {t("list.keyword")}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mist-500"
              />
              <input
                id="package-search"
                name="search"
                type="search"
                placeholder={t("list.keywordPlaceholder")}
                className="h-12 w-full rounded-full border border-white/20 bg-white pr-4 pl-11 text-base text-ink-900 outline-none focus-visible:ring-3 focus-visible:ring-cyan-400/60"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 cursor-pointer items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground outline-none hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-cyan-400/60"
            >
              {t("list.search")}
            </button>
          </form>
        }
      />
      <Suspense fallback={<Skeleton className="h-[720px] rounded-2xl" />}>
        <PackageResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
