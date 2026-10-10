import { Suspense } from "react";
import type { Metadata } from "next";
import { Compass, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PackageCategorySchema, type PackageCategory } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PackageCard } from "@/components/travel/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listPackages } from "@/lib/data/travel";
import type { PackageSort } from "@/lib/data/types";
import { formatMonth } from "@/lib/search/isoDate";
import { FilterDisclosure } from "./_components/FilterDisclosure";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Packages");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/tour-packages" },
  };
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

async function PackageResults({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const search = one(params, "search")?.slice(0, 80) ?? "";
  const destination = one(params, "destination");
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
  const active = [destination, category, length !== "any", budget !== "any", month].filter(
    Boolean,
  ).length;
  const more = new URLSearchParams(
    Object.entries({
      search,
      destination,
      category,
      length,
      budget,
      month,
      sort,
      limit: String(limit + PAGE),
    }).filter((entry): entry is [string, string] => Boolean(entry[1]) && entry[1] !== "any"),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
      <aside aria-label={t("list.filters")}>
        <FilterDisclosure label={t("list.filters")} count={active}>
          <form
            method="get"
            className="flex flex-col gap-4 rounded-2xl border border-mist-200 bg-white p-4"
          >
            {search ? <input type="hidden" name="search" value={search} /> : null}
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
            <label className={labelClass}>
              {t("list.category")}
              <select name="category" defaultValue={category ?? ""} className={selectClass}>
                <option value="">{t("list.anyCategory")}</option>
                {PackageCategorySchema.options.map((value) => (
                  <option key={value} value={value}>
                    {t(`list.categories.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {t("list.length")}
              <select name="length" defaultValue={length} className={selectClass}>
                {(Object.keys(LENGTHS) as Array<keyof typeof LENGTHS>).map((value) => (
                  <option key={value} value={value}>
                    {t(`list.lengths.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              {t("list.budget")}
              <select name="budget" defaultValue={budget} className={selectClass}>
                {(Object.keys(BUDGETS) as Array<keyof typeof BUDGETS>).map((value) => (
                  <option key={value} value={value}>
                    {t(`list.budgets.${value}`)}
                  </option>
                ))}
              </select>
            </label>
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
            <button
              type="submit"
              className="h-12 cursor-pointer rounded-full bg-primary text-[15px] font-semibold text-primary-foreground outline-none hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {t("list.apply")}
            </button>
            {active > 0 || search ? (
              <Link
                href="/tour-packages"
                className="text-center text-[14px] font-semibold text-brand-700 hover:underline"
              >
                {t("list.clear")}
              </Link>
            ) : null}
          </form>
        </FilterDisclosure>
      </aside>

      <div className="flex min-w-0 flex-col gap-5">
        <div aria-live="polite" className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-semibold text-mist-700">
            {t("list.count", { count: page.total })}
          </h2>
          {page.items.some((p) => p.sample) ? <SampleBadge label={t("detail.sample")} /> : null}
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
            href={`/tour-packages?${more.toString()}`}
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
  );
}

/** /tour-packages (Packages, Packages-empty, Packages-m, Packages-m-filters): filters in the URL, no-JS form. */
export default async function PackagesPage({ searchParams }: PageProps<"/[locale]/tour-packages">) {
  const t = await getTranslations("Packages");
  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-[62ch] flex-col gap-2">
          <h1 className="type-h1 text-navy-900">{t("list.title")}</h1>
          <p className="type-lead text-mist-600">{t("list.lead")}</p>
        </div>
        <form method="get" role="search" className="flex w-full max-w-md gap-2">
          <label className="sr-only" htmlFor="package-search">
            {t("list.keyword")}
          </label>
          <input
            id="package-search"
            name="search"
            type="search"
            placeholder={t("list.keywordPlaceholder")}
            className="h-12 min-w-0 flex-1 rounded-full border border-mist-300 bg-white px-5 text-base outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20"
          />
          <button
            type="submit"
            aria-label={t("list.search")}
            className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground hover:bg-brand-700"
          >
            <Search aria-hidden="true" className="size-5" />
          </button>
        </form>
      </header>
      <Suspense fallback={<Skeleton className="h-[720px] rounded-2xl" />}>
        <PackageResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
