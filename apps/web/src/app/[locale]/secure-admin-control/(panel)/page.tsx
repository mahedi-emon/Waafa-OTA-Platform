import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatTaka, type InboxCountKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { BarList } from "@/components/admin/BarList";
import { KpiCard } from "@/components/admin/KpiCard";
import { RelativeTime } from "@/components/admin/RelativeTime";
import { SetupChecklist } from "@/components/admin/SetupChecklist";
import { LineChart } from "@/components/admin/dashboard/LineChart";
import { TodayCard } from "@/components/admin/dashboard/TodayCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { formatDhakaTime, formatPlainDate } from "@/lib/admin/format";
import { loadSetup } from "@/lib/admin/loadSetup";
import { conversionPercent, todayCards, weekChange } from "@/lib/admin/todayQueue";
import type { DashboardSummary } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.dashboard");
  return { title: t("metaTitle") };
}

type InboxCounts = { counts: Partial<Record<InboxCountKey, number>> };

/** "12 Oct" for chart labels. */
const shortDay = (day: string) => formatPlainDate(day).replace(/\s\d{4}$/, "");

async function Dashboard() {
  const [staff, data, inbox, steps, t, tc, tm] = await Promise.all([
    requireStaff(),
    adminGet<DashboardSummary>("/admin/dashboard"),
    adminGet<InboxCounts>("/admin/inbox").catch(() => null),
    loadSetup(),
    getTranslations("Admin.dashboard"),
    getTranslations("Admin.counts"),
    getTranslations("Admin.modules"),
  ]);
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;
  const cards = todayCards(inbox?.counts ?? {});
  const changeOf = (week: { thisWeek: number; lastWeek: number }) => {
    const change = weekChange(week.thisWeek, week.lastWeek);
    return {
      direction: change.direction,
      text:
        change.direction === "same"
          ? t("change.same")
          : t(`change.${change.direction}`, { count: change.by }),
    };
  };
  const series = data.series;
  const booked14 = series.reduce((sum, day) => sum + day.booked, 0);
  const leads14 = series.reduce((sum, day) => sum + day.leads, 0);
  const lineFor = (key: InboxCountKey, count: number) => {
    if (count === 0) return t("today.clear");
    if (key === "newLeads" && data.oldestNewAt)
      return (
        <>
          {t("today.oldest")} <RelativeTime iso={data.oldestNewAt} />
        </>
      );
    if (key === "overdueLeads") return t("today.target", { sla: data.slaMinutes });
    if (key === "sampleLeft") return t("today.sample");
    return undefined;
  };

  return (
    <>
      <AdminPageHeader
        title={t("greeting", { name: firstName })}
        lead={t("lead", { sla: data.slaMinutes })}
        actions={
          <Button asChild size="sm">
            <Link href="/secure-admin-control/leads?view=open" prefetch={false}>
              {t("openLeads")}
            </Link>
          </Button>
        }
      />

      {cards.length > 0 ? (
        <section aria-labelledby="dash-today" className="mb-8">
          <h2 id="dash-today" className="mb-3 font-display text-[17px] font-bold text-navy-900">
            {t("today.title")}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <li key={card.key}>
                <TodayCard
                  kind={card.key}
                  count={card.count}
                  href={card.href}
                  label={
                    card.count === 0
                      ? t(`today.titles.${card.key}`)
                      : tc(card.key, { count: card.count })
                  }
                  line={lineFor(card.key, card.count)}
                  urgent={card.key === "overdueLeads"}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="dash-kpis" className="mb-8">
        <h2 id="dash-kpis" className="mb-3 font-display text-[17px] font-bold text-navy-900">
          {t("kpis")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <li>
            <KpiCard
              label={t("kpiLeads")}
              value={data.weeks.leads.thisWeek}
              href="/secure-admin-control/leads"
              trend={series.map((day) => day.leads)}
              change={changeOf(data.weeks.leads)}
            />
          </li>
          <li>
            <KpiCard
              label={t("kpiBooked")}
              value={formatTaka(data.weeks.bookedValue.thisWeek)}
              href="/secure-admin-control/leads?view=closed"
              trend={series.map((day) => day.bookedValue)}
              change={{
                direction: "none",
                text: t("bookedLine", { count: data.weeks.booked.thisWeek }),
              }}
            />
          </li>
          {data.weeks.orders ? (
            <li>
              <KpiCard
                label={t("kpiOrders")}
                value={data.weeks.orders.thisWeek}
                href="/secure-admin-control/orders"
                trend={series.map((day) => day.orders ?? 0)}
                change={changeOf(data.weeks.orders)}
              />
            </li>
          ) : null}
          <li>
            <KpiCard
              label={t("kpiRate")}
              value={`${conversionPercent(booked14, leads14)}%`}
              href="/secure-admin-control/reports"
              change={{
                direction: "none",
                text: t("rateLine", { booked: booked14, leads: leads14 }),
              }}
            />
          </li>
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AdminPanel title={t("byDay")} lead={t("byDayLead")}>
          <LineChart
            label={t("byDayLabel")}
            points={series.map((day) => ({
              day: day.day,
              label: shortDay(day.day),
              value: day.leads,
            }))}
            strings={{ table: t("asTable"), day: t("day"), value: t("leadsWord") }}
          />
        </AdminPanel>
        <AdminPanel title={t("byModule")} lead={t("byModuleLead")}>
          <BarList
            empty={t("noData")}
            rows={data.leads.byModule
              .toSorted((a, b) => b.count - a.count)
              .slice(0, 6)
              .map((row) => ({ key: row.module, label: tm(row.module), value: row.count }))}
          />
        </AdminPanel>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AdminPanel title={t("activity")} lead={t("activityLead")} flush>
          {data.activity.length === 0 ? (
            <p className="px-5 pb-5 text-[14px] text-mist-600">{t("noData")}</p>
          ) : (
            <ul className="divide-y divide-mist-100 border-t border-mist-100">
              {data.activity.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-3">
                  <time
                    dateTime={item.createdAt}
                    className="w-16 shrink-0 pt-0.5 text-[13px] text-mist-500 tabular-nums"
                  >
                    {formatDhakaTime(item.createdAt)}
                  </time>
                  <p className="min-w-0 flex-1 text-[14px] text-ink-900">
                    {t("activityLine", { actor: item.actor })}{" "}
                    <Link
                      href={`/secure-admin-control/leads/${item.leadId}`}
                      prefetch={false}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {item.reference}
                    </Link>
                    <span className="block truncate text-[13.5px] text-mist-600">{item.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
        <SetupChecklist steps={steps} />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 w-80 rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

/** Dashboard (ADMIN.md §5.2): today's work, the week in numbers, leads by day and service, activity and setup. */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
