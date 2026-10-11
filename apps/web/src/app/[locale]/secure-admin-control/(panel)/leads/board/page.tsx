import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LeadModuleSchema, type LeadStatus } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { ageParts } from "@/lib/admin/format";
import type { LeadList } from "@/lib/admin/types";
import { BoardCard } from "./_components/BoardCard";

/** The stages a lead moves through on the board; closed stages stay on the list view. */
const STAGES: LeadStatus[] = ["new", "pending", "in-progress", "quoted", "booked"];
const PER_STAGE = 30;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.leadBoard");
  return { title: t("metaTitle") };
}

async function LeadBoard({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/leads/board">["searchParams"];
}) {
  const params = await searchParams;
  const service = LeadModuleSchema.safeParse(
    typeof params.module === "string" ? params.module : undefined,
  ).data;
  const [columns, t, tm, ts] = await Promise.all([
    Promise.all(
      STAGES.map((status) =>
        adminGet<LeadList>("/admin/leads", {
          status,
          ...(service ? { module: service } : {}),
          pageSize: PER_STAGE,
        }),
      ),
    ),
    getTranslations("Admin.leadBoard"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
  ]);
  const ageLabel = (minutes: number) => {
    const age = ageParts(minutes);
    return age.unit === "minutes"
      ? t("ageMinutes", { count: age.value })
      : age.unit === "hours"
        ? t("ageHours", { count: age.value })
        : t("ageDays", { count: age.value });
  };
  const stageNames = Object.fromEntries(STAGES.map((stage) => [stage, ts(stage)])) as Record<
    LeadStatus,
    string
  >;

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        lead={t("lead")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/secure-admin-control/leads">{t("listView")}</Link>
          </Button>
        }
      />
      <nav aria-label={t("filter")} className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={service ? "ghost" : "secondary"}>
          <Link
            href="/secure-admin-control/leads/board"
            aria-current={service ? undefined : "page"}
          >
            {t("allServices")}
          </Link>
        </Button>
        {LeadModuleSchema.options.map((key) => (
          <Button key={key} asChild size="sm" variant={service === key ? "secondary" : "ghost"}>
            <Link
              href={`/secure-admin-control/leads/board?module=${key}`}
              aria-current={service === key ? "page" : undefined}
            >
              {tm(key)}
            </Link>
          </Button>
        ))}
      </nav>
      {/* Scrolls sideways on narrow screens; focusable so keyboard users can scroll it too. */}
      <div
        role="region"
        aria-label={t("title")}
        tabIndex={0}
        className="-mx-4 overflow-x-auto px-4 pb-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:mx-0 md:px-0"
      >
        <ol className="grid min-w-[1100px] grid-cols-5 gap-3">
          {STAGES.map((stage, index) => {
            const column = columns[index];
            return (
              <li
                key={stage}
                aria-labelledby={`stage-${stage}`}
                className="flex min-w-0 flex-col gap-2 rounded-2xl bg-mist-50 p-3"
              >
                <h2
                  id={`stage-${stage}`}
                  className="flex items-center justify-between gap-2 px-1 text-sm font-bold text-navy-900"
                >
                  {stageNames[stage]}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[12px] text-mist-700 tabular-nums">
                    {column?.total ?? 0}
                  </span>
                </h2>
                {column && column.items.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {column.items.map((lead) => (
                      <BoardCard
                        key={lead.id}
                        lead={{
                          id: lead.id,
                          reference: lead.reference,
                          name: lead.name,
                          summary: lead.summary,
                          module: tm(lead.module),
                          status: lead.status,
                          assignee: lead.assignee?.name ?? null,
                          age: ageLabel(lead.ageMinutes),
                          overdue: lead.overdue,
                        }}
                        stages={STAGES}
                        stageNames={stageNames}
                        strings={{
                          moveTo: t("moveTo"),
                          moveBack: t("moveBack", { stage: "{stage}" }),
                          moveForward: t("moveForward", { stage: "{stage}" }),
                          moved: t("moved", { reference: "{reference}", stage: "{stage}" }),
                          open: t("open"),
                          bookHint: t("bookHint"),
                          overdue: t("overdue"),
                          unassigned: t("unassigned"),
                          failed: t("failed"),
                        }}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="px-1 py-6 text-center text-[13px] text-mist-600">{t("empty")}</p>
                )}
                {column && column.total > column.items.length ? (
                  <Link
                    href={`/secure-admin-control/leads?status=${stage}${service ? `&module=${service}` : ""}`}
                    className="px-1 text-[13px] font-semibold text-brand-700 hover:underline"
                  >
                    {t("more", { count: column.total - column.items.length })}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

/** Admin › Leads › Board (issue 113): open leads by stage with quick moves. */
export default function LeadBoardPage(
  props: PageProps<"/[locale]/secure-admin-control/leads/board">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <LeadBoard searchParams={props.searchParams} />
    </Suspense>
  );
}
