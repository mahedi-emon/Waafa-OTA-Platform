import { Suspense } from "react";
import type { Metadata } from "next";
import { Info, PlaneTakeoff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { GroupFare } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { GroupFareCard } from "@/components/travel/GroupFareCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { listGroupFares } from "@/lib/data/travel";
import { formatMonth } from "@/lib/search/isoDate";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Flights.groupPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/flights/group-fares" },
  };
}

const SORTS = ["date", "price", "seats"] as const;
type Sort = (typeof SORTS)[number];

function sortFares(fares: GroupFare[], sort: Sort): GroupFare[] {
  const copy = [...fares];
  if (sort === "price") return copy.sort((a, b) => a.farePerAdult - b.farePerAdult);
  if (sort === "seats") return copy.sort((a, b) => (b.seatsLeft ?? 0) - (a.seatsLeft ?? 0));
  return copy.sort((a, b) => a.departDate.localeCompare(b.departDate));
}

const selectClass =
  "h-12 w-full rounded-xl border border-mist-300 bg-white px-3 text-[15px] text-ink-900 outline-none focus-visible:border-electric-600 focus-visible:ring-3 focus-visible:ring-ring/20";

async function GroupFareList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const to = typeof params.to === "string" && /^[A-Z]{3}$/.test(params.to) ? params.to : undefined;
  const month =
    typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : undefined;
  const sort: Sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : "date";
  const [all, filtered, t, tHome] = await Promise.all([
    listGroupFares(),
    listGroupFares({ ...(to ? { to } : {}), ...(month ? { month } : {}) }),
    getTranslations("Flights.groupPage"),
    getTranslations("Home"),
  ]);
  const destinations = [...new Map(all.map((fare) => [fare.to.iata, fare.to.city])).entries()];
  const months = [...new Set(all.map((fare) => fare.departDate.slice(0, 7)))].sort();
  const fares = sortFares(filtered, sort);

  return (
    <div className="flex flex-col gap-6">
      <form
        method="get"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-mist-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
      >
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900">
          {t("to")}
          <select name="to" defaultValue={to ?? ""} className={selectClass}>
            <option value="">{t("anyDestination")}</option>
            {destinations.map(([iata, city]) => (
              <option key={iata} value={iata}>
                {city} ({iata})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900">
          {t("month")}
          <select name="month" defaultValue={month ?? ""} className={selectClass}>
            <option value="">{t("anyMonth")}</option>
            {months.map((value) => (
              <option key={value} value={value}>
                {formatMonth(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ink-900">
          {t("sort")}
          <select name="sort" defaultValue={sort} className={selectClass}>
            <option value="date">{t("sortDate")}</option>
            <option value="price">{t("sortPrice")}</option>
            <option value="seats">{t("sortSeats")}</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-12 cursor-pointer rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground outline-none hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-ring/40 sm:col-span-2 lg:col-span-1"
        >
          {t("apply")}
        </button>
      </form>

      <div aria-live="polite" className="flex flex-wrap items-center gap-2">
        <h2 className="text-[15px] font-semibold text-mist-700">
          {t("count", { count: fares.length })}
        </h2>
        {fares.some((fare) => fare.sample) ? (
          <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
        ) : null}
      </div>

      {fares.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fares.map((fare) => (
            <li key={fare.id}>
              <GroupFareCard fare={fare} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={PlaneTakeoff}
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={to ? `/flights?to=${to}` : "/flights"}
                className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-brand-700"
              >
                {t("emptyAction")}
              </Link>
              <Link
                href="/flights/group-fares"
                className="inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-brand-700 hover:underline"
              >
                {t("clear")}
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}

/** /flights/group-fares (GroupFares, GroupFares-empty, -m): fixed-date seats, filtered with a plain GET form. */
export default async function GroupFaresPage({
  searchParams,
}: PageProps<"/[locale]/flights/group-fares">) {
  const [t, tFlights] = await Promise.all([
    getTranslations("Flights.groupPage"),
    getTranslations("Flights"),
  ]);
  const steps = [
    [t("how1Title"), t("how1Body")],
    [t("how2Title"), t("how2Body")],
    [t("how3Title"), t("how3Body")],
  ] as const;

  return (
    <main id="main" className="site-container flex flex-col gap-6 pt-4 pb-28 md:pt-6">
      <Breadcrumbs
        items={[{ label: tFlights("breadcrumb"), href: "/flights" }, { label: t("breadcrumb") }]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="max-w-[24ch] type-h1 text-navy-900">{t("title")}</h1>
        <p className="max-w-[68ch] type-lead text-mist-600">{t("lead")}</p>
      </header>
      <section aria-label={t("howTitle")}>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map(([title, body], index) => (
            <li key={title} className="flex gap-3 rounded-2xl bg-mist-50 p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-[14px] font-bold text-white">
                {index + 1}
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-navy-900">{title}</span>
                <span className="block text-[13.5px] text-mist-600">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <Suspense fallback={<Skeleton className="h-[520px] rounded-2xl" />}>
        <GroupFareList searchParams={searchParams} />
      </Suspense>
      <p className="flex gap-2 rounded-2xl border border-mist-200 bg-white p-4 text-[14px] leading-relaxed text-mist-700">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
        {t("about")}
      </p>
    </main>
  );
}
