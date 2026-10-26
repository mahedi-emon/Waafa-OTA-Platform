import { Suspense } from "react";
import type { Metadata } from "next";
import { PlaneTakeoff } from "lucide-react";
import { Info } from "@/components/icons/server/Info";
import { getTranslations } from "next-intl/server";
import type { GroupFare } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { GroupFareCard } from "@/components/travel/GroupFareCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { listGroupFares } from "@/lib/data/travel";
import { formatMonth } from "@/lib/search/isoDate";
import { withSocial } from "@/lib/seo/withSocial";
import { ExploreMore } from "@/components/seo/ExploreMore";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Flights.groupPage");
  return withSocial({
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/flights/group-fares" },
  });
}

const SORTS = ["date", "price", "seats"] as const;
type Sort = (typeof SORTS)[number];

function sortFares(fares: GroupFare[], sort: Sort): GroupFare[] {
  const copy = [...fares];
  if (sort === "price") return copy.sort((a, b) => a.farePerAdult - b.farePerAdult);
  if (sort === "seats") return copy.sort((a, b) => (b.seatsLeft ?? 0) - (a.seatsLeft ?? 0));
  return copy.sort((a, b) => a.departDate.localeCompare(b.departDate));
}

/** "/flights/group-fares?…" for a filter set, leaving out empty and default values. */
function faresHref(values: { to?: string; month?: string; sort?: Sort }): string {
  const params = new URLSearchParams();
  if (values.to) params.set("to", values.to);
  if (values.month) params.set("month", values.month);
  if (values.sort && values.sort !== "date") params.set("sort", values.sort);
  const search = params.toString();
  return search ? `/flights/group-fares?${search}` : "/flights/group-fares";
}

type Chip = { key: string; label: string; count?: number; href: string; current: boolean };

/** One labelled row of filter chips (GroupFares board): a tap applies the filter, the current chip is navy. */
function ChipRow({ label, items }: { label: string; items: Chip[] }) {
  return (
    <nav
      aria-label={label}
      className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
    >
      <span className="w-20 shrink-0 text-[12px] font-bold tracking-[0.12em] text-mist-600 uppercase">
        {label}
      </span>
      <ul className="-mx-4 flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.current ? "true" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[14px] font-semibold whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                item.current
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-mist-200 bg-white text-ink-900 hover:border-mist-300 hover:bg-mist-50",
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={cn(
                    "text-[12px] tabular-nums",
                    item.current ? "text-white/70" : "text-mist-500",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

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
      <div className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4">
        <ChipRow
          label={t("to")}
          items={[
            {
              key: "all",
              label: t("all"),
              count: all.length,
              href: faresHref({ month, sort }),
              current: !to,
            },
            ...destinations.map(([iata, city]) => ({
              key: iata,
              label: city,
              count: all.filter((fare) => fare.to.iata === iata).length,
              href: faresHref({ to: iata, month, sort }),
              current: to === iata,
            })),
          ]}
        />
        <ChipRow
          label={t("month")}
          items={[
            { key: "all", label: t("allMonths"), href: faresHref({ to, sort }), current: !month },
            ...months.map((value) => ({
              key: value,
              label: formatMonth(value),
              href: faresHref({ to, month: value, sort }),
              current: month === value,
            })),
          ]}
        />
        <ChipRow
          label={t("sort")}
          items={(
            [
              ["date", t("sortDate")],
              ["price", t("sortPrice")],
              ["seats", t("sortSeats")],
            ] as const
          ).map(([value, label]) => ({
            key: value,
            label,
            href: faresHref({ to, month, sort: value }),
            current: sort === value,
          }))}
        />
      </div>

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

/** /flights/group-fares (GroupFares, GroupFares-empty, -m): fixed-date seats, filtered by chips in the URL (one tap each). */
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        <header className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-brand-700" />
            {t("breadcrumb")}
          </p>
          <h1 className="max-w-[24ch] type-h1 text-navy-900">{t("title")}</h1>
          <p className="max-w-[60ch] type-lead text-mist-600">{t("lead")}</p>
        </header>
        <section
          aria-label={t("howTitle")}
          className="rounded-2xl border border-mist-200 bg-white p-4 shadow-md"
        >
          <ol className="flex flex-col divide-y divide-mist-100">
            {steps.map(([title, body], index) => (
              <li key={title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
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
      </div>
      <Suspense fallback={<Skeleton className="h-[520px] rounded-2xl" />}>
        <GroupFareList searchParams={searchParams} />
      </Suspense>
      <p className="flex gap-2 rounded-2xl border border-mist-200 bg-white p-4 text-[14px] leading-relaxed text-mist-700">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" />
        {t("about")}
      </p>
      <ExploreMore groups={["routes", "visa", "packages"]} />
    </main>
  );
}
