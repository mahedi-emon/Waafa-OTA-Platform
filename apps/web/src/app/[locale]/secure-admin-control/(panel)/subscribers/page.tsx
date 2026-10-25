import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CustomerTabs } from "@/components/admin/CustomerTabs";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import { removeSubscriber } from "@/lib/admin/opsActions";
import type { Paged, SubscriberRow } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.subscribers");
  return { title: t("metaTitle") };
}

const PATH = "/secure-admin-control/subscribers";
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Subscribers({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/subscribers">["searchParams"];
}) {
  const params = await searchParams;
  const q = one(params.q)?.slice(0, 80);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<SubscriberRow>>("/admin/subscribers", {
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
    }),
    getTranslations("Admin.subscribers"),
    getTranslations("Admin.common"),
  ]);

  const rows: DataRow[] = list.items.map((row) => {
    const when = formatDhakaDateTime(row.createdAt);
    return {
      id: row.id,
      title: row.email,
      thumb: { initials: row.email.slice(0, 2).toUpperCase() },
      chips: [],
      facts: {
        source: { text: row.source ?? "", kind: "muted" },
        when: { text: when, kind: "date" },
      },
      summary: [
        { label: t("colEmail"), value: row.email },
        ...(row.source ? [{ label: t("colSource"), value: row.source }] : []),
        { label: t("colWhen"), value: when },
      ],
      actions: (
        <ActionButton
          action={removeSubscriber.bind(null, row.id)}
          success={t("removed")}
          failed={tc("unavailable")}
          variant="secondary"
          confirm={t("removeConfirm", { email: row.email })}
        >
          {t("remove")}
        </ActionButton>
      ),
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colEmail"), always: true },
    { key: "source", label: t("colSource") },
    { key: "when", label: t("colWhen") },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <CustomerTabs current="newsletter" />
      <AdminDataTable
        listKey="subscribers"
        path={PATH}
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        openLabel={tc("open")}
        empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
      />
    </>
  );
}

/** Newsletter (FR-FTR-05): a tab beside Customers (ADMIN.md §3.1) on the shared DataTable (issue 229). */
export default function SubscribersPage(
  props: PageProps<"/[locale]/secure-admin-control/subscribers">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Subscribers searchParams={props.searchParams} />
    </Suspense>
  );
}
