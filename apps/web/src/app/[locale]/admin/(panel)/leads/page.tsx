import { Suspense } from "react";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadModuleSchema, LeadStatusSchema } from "@waafa/shared";
import { cn } from "cn";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListFilters } from "@/components/admin/ListFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { ageParts } from "@/lib/admin/format";
import type { LeadList, StaffDirectoryEntry } from "@/lib/admin/types";
import { LeadsTable } from "./_components/LeadsTable";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.leads");
  return { title: t("metaTitle") };
}

const VIEWS = ["all", "open", "mine", "unassigned", "overdue"] as const;
type View = (typeof VIEWS)[number];

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Leads({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/admin/leads">["searchParams"];
}) {
  const params = await searchParams;
  const view: View = VIEWS.find((item) => item === one(params.view)) ?? "all";
  const query = {
    view,
    module: LeadModuleSchema.safeParse(one(params.module)).data,
    status: LeadStatusSchema.safeParse(one(params.status)).data,
    q: one(params.q)?.slice(0, 80),
    page: Math.max(1, Number(one(params.page)) || 1),
  };
  const [list, staff, t, tc, tm, ts] = await Promise.all([
    adminGet<LeadList>("/admin/leads", { ...query, pageSize: 25 }),
    adminGet<StaffDirectoryEntry[]>("/admin/staff"),
    getTranslations("Admin.leads"),
    getTranslations("Admin.common"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
  ]);

  const modules = Object.fromEntries(LeadModuleSchema.options.map((key) => [key, tm(key)]));
  const statuses = Object.fromEntries(LeadStatusSchema.options.map((key) => [key, ts(key)]));
  const ages = Object.fromEntries(
    list.items.map((row) => {
      const age = ageParts(row.ageMinutes);
      const label =
        age.unit === "minutes"
          ? t("ageMinutes", { minutes: age.value })
          : age.unit === "hours"
            ? t("ageHours", { hours: age.value })
            : t("ageDays", { days: age.value });
      return [row.id, label];
    }),
  );
  const current: Record<string, string | undefined> = {
    view: view === "all" ? undefined : view,
    module: query.module,
    status: query.status,
    q: query.q,
  };
  const exportQuery = new URLSearchParams(
    Object.entries(current).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        lead={t("lead", { sla: list.slaMinutes })}
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href={`/admin/leads/export${exportQuery ? `?${exportQuery}` : ""}`}>
              <Download aria-hidden="true" className="size-4" />
              {t("export")}
            </a>
          </Button>
        }
      />
      <nav aria-label={t("title")} className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
        {VIEWS.map((item) => (
          <Link
            key={item}
            href={item === "all" ? "/admin/leads" : `/admin/leads?view=${item}`}
            prefetch={false}
            aria-current={item === view ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center rounded-full px-4 text-[14.5px] font-semibold transition-colors duration-150",
              item === view
                ? "bg-navy-900 text-white"
                : "bg-white text-navy-900 ring-1 ring-mist-200 hover:bg-mist-50",
            )}
          >
            {t(`views.${item}`)}
          </Link>
        ))}
      </nav>
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <div className="border-b border-mist-100 p-4">
          <ListFilters
            query={current}
            search={{
              name: "q",
              label: tc("search"),
              placeholder: t("searchPlaceholder"),
              value: query.q ?? "",
            }}
            selects={[
              {
                name: "module",
                label: t("module"),
                value: query.module ?? "",
                options: [
                  { value: "", label: t("allModules") },
                  ...LeadModuleSchema.options.map((key) => ({ value: key, label: tm(key) })),
                ],
              },
              {
                name: "status",
                label: t("status"),
                value: query.status ?? "",
                options: [
                  { value: "", label: t("allStatuses") },
                  ...LeadStatusSchema.options.map((key) => ({ value: key, label: ts(key) })),
                ],
              },
            ]}
            strings={{ apply: tc("apply"), reset: tc("reset") }}
          />
        </div>
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <LeadsTable
            rows={list.items}
            staff={staff}
            modules={modules}
            statuses={statuses}
            ages={ages}
            strings={{
              reference: t("colReference"),
              customer: t("colCustomer"),
              trip: t("colTrip"),
              date: t("colDate"),
              status: t("colStatus"),
              assignee: t("colAssignee"),
              age: t("colAge"),
              source: t("colSource"),
              duplicate: t("duplicate"),
              unassigned: t("unassigned"),
              selected: t("selected", { count: "{count}" }),
              assignTo: t("assignTo"),
              changeStatus: t("changeStatus"),
              apply: tc("apply"),
              bulkDone: t("bulkDone", { count: "{count}" }),
              selectAll: t("selectAll"),
              select: t("select", { reference: "{reference}" }),
              call: t("call"),
              whatsapp: t("whatsapp"),
              open: tc("open"),
              failed: tc("unavailable"),
            }}
          />
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/admin/leads"
          query={current}
          strings={{
            previous: tc("previous"),
            next: tc("next"),
            summary: tc("showing", { shown: list.items.length, total: list.total }),
          }}
        />
      </section>
    </>
  );
}

/** Leads (AdminLeads, AdminLeads-bulk, AdminLeads-m boards). */
export default function LeadsPage(props: PageProps<"/[locale]/admin/leads">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-2xl" />}>
      <Leads searchParams={props.searchParams} />
    </Suspense>
  );
}
