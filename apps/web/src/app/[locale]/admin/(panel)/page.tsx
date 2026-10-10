import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { BarList } from "@/components/admin/BarList";
import { KpiCard } from "@/components/admin/KpiCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, taka } from "@/lib/admin/format";
import type { DashboardSummary } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.dashboard");
  return { title: t("metaTitle") };
}

async function Dashboard() {
  const [staff, data, t, tm, ts] = await Promise.all([
    requireStaff(),
    adminGet<DashboardSummary>("/admin/dashboard"),
    getTranslations("Admin.dashboard"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
  ]);
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;
  const store = hasRole(staff, "admin", "shop-manager", "accounts");
  const content = hasRole(staff, "admin", "content-editor");

  return (
    <>
      <AdminPageHeader
        title={t("greeting", { name: firstName })}
        lead={t("lead", { sla: data.slaMinutes })}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/leads?view=open" prefetch={false}>
              {t("openLeads")}
            </Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={t("kpiNewToday")} value={data.leads.newToday} href="/admin/leads" />
        <KpiCard label={t("kpiOpen")} value={data.leads.open} href="/admin/leads?view=open" />
        <KpiCard
          label={t("kpiOverdue")}
          value={data.leads.overdue}
          href="/admin/leads?view=overdue"
          tone={data.leads.overdue > 0 ? "alert" : "neutral"}
        />
        <KpiCard
          label={t("kpiBooked")}
          value={data.leads.bookedThisMonth}
          href="/admin/leads?status=booked"
        />
        {store ? (
          <>
            <KpiCard label={t("kpiOrdersToday")} value={data.orders.today} href="/admin/orders" />
            <KpiCard
              label={t("kpiRevenue")}
              value={taka(data.orders.revenueThisMonth)}
              href="/admin/orders"
            />
            <KpiCard
              label={t("kpiProofs")}
              value={data.proofsPending}
              href="/admin/payments"
              tone={data.proofsPending > 0 ? "alert" : "neutral"}
            />
          </>
        ) : null}
        {content ? (
          <KpiCard
            label={t("kpiFeedback")}
            value={data.feedbackPending}
            href="/admin/feedback"
            tone={data.feedbackPending > 0 ? "alert" : "neutral"}
          />
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AdminPanel title={t("byModule")} lead={t("byModuleLead")}>
          <BarList
            empty={t("noData")}
            rows={data.leads.byModule
              .toSorted((a, b) => b.count - a.count)
              .map((row) => ({ key: row.module, label: tm(row.module), value: row.count }))}
          />
        </AdminPanel>
        <AdminPanel title={t("byStatus")} lead={t("byStatusLead")}>
          <BarList
            empty={t("noData")}
            rows={data.leads.byStatus
              .toSorted((a, b) => b.count - a.count)
              .map((row) => ({ key: row.status, label: ts(row.status), value: row.count }))}
          />
        </AdminPanel>
        <AdminPanel
          title={t("topRoutes")}
          lead={t("topRoutesLead")}
          action={
            <Link
              href="/admin/search"
              prefetch={false}
              className="text-[13.5px] font-semibold text-brand-700 hover:underline"
            >
              {t("searchActivity")}
            </Link>
          }
        >
          <BarList
            empty={t("noData")}
            rows={data.topRoutes.map((row) => ({
              key: `${row.module}-${row.summary}`,
              label: row.summary,
              value: row.count,
            }))}
          />
        </AdminPanel>
      </div>

      <AdminPanel title={t("activity")} lead={t("activityLead")} className="mt-4" flush>
        {data.activity.length === 0 ? (
          <p className="px-5 pb-5 text-[14px] text-mist-600">{t("noData")}</p>
        ) : (
          <ul className="divide-y divide-mist-100">
            {data.activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-0.5 px-5 py-3 md:flex-row md:items-baseline md:gap-4"
              >
                <Link
                  href={`/admin/leads/${item.leadId}`}
                  prefetch={false}
                  className="shrink-0 font-mono text-[13px] font-semibold text-brand-700 hover:underline"
                >
                  {item.reference}
                </Link>
                <p className="min-w-0 flex-1 truncate text-[14px] text-ink-900">
                  <span className="font-semibold">{item.actor}</span> · {item.body}
                </p>
                <time className="shrink-0 text-[12.5px] text-mist-500" dateTime={item.createdAt}>
                  {formatDhakaDateTime(item.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 w-80 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-[112px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

/** Dashboard (AdminDash, AdminDash-m boards). */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
