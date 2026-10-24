import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { LeadModuleSchema, type LeadModule } from "@waafa/shared";
import { LEAD_BOARD_COLUMNS, type LeadBoardColumn } from "@waafa/shared/workflow/leads";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LeadBoardView } from "@/components/admin/board/LeadBoardView";
import type { BoardColumnData } from "@/components/admin/board/types";
import { LeadModuleTabs } from "@/components/admin/inbox/LeadModuleTabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { ageParts, whatsappHref } from "@/lib/admin/format";
import { queueSearch, withSearch } from "@/lib/admin/queues";
import type { LeadList } from "@/lib/admin/types";

const PER_COLUMN = 30;
const LEADS = "/secure-admin-control/leads";
const BOARD = `${LEADS}/board`;
/** Only the board's and the lead steps' words reach the browser (scoped provider, D190). */
const BOARD_MESSAGES = ["Admin.leadBoard", "Admin.leadActions"];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.leadBoard");
  return { title: t("metaTitle") };
}

/** Each column's slice of the list: one status, or lost and cancelled together for Closed. */
const columnQuery = (column: LeadBoardColumn) =>
  column === "closed" ? { view: "closed" } : { status: column };

async function LeadBoard({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/leads/board">["searchParams"];
}) {
  const params = await searchParams;
  const service = LeadModuleSchema.safeParse(
    typeof params.module === "string" ? params.module : undefined,
  ).data;
  const [lists, t, tl, tm, ts, tlead, messages] = await Promise.all([
    Promise.all(
      LEAD_BOARD_COLUMNS.map((column, index) =>
        adminGet<LeadList>("/admin/leads", {
          ...columnQuery(column),
          ...(service ? { module: service } : {}),
          pageSize: PER_COLUMN,
          // The service tabs' counts come once, with the first column.
          ...(index === 0 ? { counts: "1" } : {}),
        }),
      ),
    ),
    getTranslations("Admin.leadBoard"),
    getTranslations("Admin.leads"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.lead"),
    getMessages(),
  ]);
  const ageLabel = (minutes: number) => {
    const age = ageParts(minutes);
    return age.unit === "minutes"
      ? t("ageMinutes", { count: age.value })
      : age.unit === "hours"
        ? t("ageHours", { count: age.value })
        : t("ageDays", { count: age.value });
  };
  const columns: BoardColumnData[] = LEAD_BOARD_COLUMNS.map((column, index) => {
    const list = lists[index];
    const listSearch = queueSearch({ ...columnQuery(column), module: service });
    return {
      id: column,
      title: column === "closed" ? t("closed") : ts(column),
      total: list?.total ?? 0,
      moreHref: withSearch(LEADS, listSearch),
      cards: (list?.items ?? []).map((lead) => ({
        id: lead.id,
        href: withSearch(`${LEADS}/${lead.id}`, listSearch),
        reference: lead.reference,
        name: lead.name,
        summary: lead.summary,
        module: tm(lead.module),
        status: lead.status,
        assignee: lead.assignee?.name ?? null,
        age: ageLabel(lead.ageMinutes),
        overdue: lead.overdue,
        phone: lead.phone,
        whatsappHref: whatsappHref(
          lead.phone,
          tlead("whatsappText", { name: lead.name, reference: lead.reference }),
        ),
      })),
    };
  });
  const tabLabels = {
    all: tl("tabs.all"),
    ...Object.fromEntries(
      LeadModuleSchema.options.map((key) => [key, tl(`tabs.${key}` as "tabs.all")]),
    ),
  } as Record<LeadModule, string> & { all: string };

  return (
    <>
      <AdminPageHeader
        back={{ href: LEADS, label: tl("title") }}
        title={t("title")}
        lead={t("lead")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={withSearch(LEADS, queueSearch({ module: service }))}>{t("listView")}</Link>
          </Button>
        }
      />
      <LeadModuleTabs
        path={BOARD}
        current={service}
        modules={lists[0]?.modules ?? []}
        keep={{}}
        labels={tabLabels}
        openLabel={tl("openCount", { count: "{count}" })}
        label={tl("tabsLabel")}
      />
      <NextIntlClientProvider messages={pickMessagePaths(messages, BOARD_MESSAGES)}>
        <LeadBoardView columns={columns} label={t("title")} />
      </NextIntlClientProvider>
    </>
  );
}

/** Admin › Leads › Board (ADMIN.md §5.5, D0 R6): drag or Move to… between stages, asking what the lead page asks. */
export default function LeadBoardPage(
  props: PageProps<"/[locale]/secure-admin-control/leads/board">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <LeadBoard searchParams={props.searchParams} />
    </Suspense>
  );
}
