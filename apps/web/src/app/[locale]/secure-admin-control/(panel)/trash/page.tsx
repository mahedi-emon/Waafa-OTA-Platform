import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import type { Paged, TrashRow } from "@/lib/admin/types";
import { TrashActions } from "./_components/TrashActions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.trash");
  return { title: t("metaTitle") };
}

const DAY = 86_400_000;
const PATH = "/secure-admin-control/trash";
const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1);
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Trash({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/trash">["searchParams"];
}) {
  const params = await searchParams;
  const q = one(params.q)?.slice(0, 80);
  const [staff, list, t, tc, tb] = await Promise.all([
    requireStaff(),
    adminGet<Paged<TrashRow>>("/admin/trash", {
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
      ...(q ? { q } : {}),
    }),
    getTranslations("Admin.trash"),
    getTranslations("Admin.common"),
    getTranslations("Admin.blueprints"),
  ]);
  // Record nouns are looked up by the record's list, so this translator is used untyped.
  const nouns = tb as unknown as ((key: string) => string) & { has: (key: string) => boolean };
  const noun = (key: string) => (nouns.has(`${key}.one`) ? capital(nouns(`${key}.one`)) : key);
  const canPurge = hasRole(staff, "super-admin");
  const now = new Date().getTime();

  const rows: DataRow[] = list.items.map((item) => {
    const days = Math.max(0, Math.ceil((Date.parse(item.purgeAt) - now) / DAY));
    const deleted = formatDhakaDateTime(item.deletedAt);
    return {
      id: item.id,
      title: item.title,
      subtitle: noun(item.collection),
      thumb: { initials: noun(item.collection).slice(0, 2).toUpperCase() },
      chips: [],
      facts: {
        deletedBy: { text: item.deletedBy },
        left: { text: t("daysLeft", { count: days }), kind: days <= 3 ? undefined : "muted" },
        deleted: { text: deleted, kind: "date" },
      },
      summary: [
        { label: t("colKind"), value: noun(item.collection) },
        { label: t("colDeletedBy"), value: item.deletedBy },
        { label: t("colDeleted"), value: deleted },
        { label: t("colLeft"), value: t("daysLeft", { count: days }) },
      ],
      actions: (
        <TrashActions
          id={item.id}
          title={item.title}
          canPurge={canPurge}
          strings={{
            restore: t("restore"),
            restored: t("restored", { title: "{title}" }),
            purge: t("purge"),
            purgeTitle: t("purgeTitle", { title: "{title}" }),
            purgeBody: t("purgeBody"),
            purgeConfirm: t("purgeConfirm"),
            purged: t("purged", { title: "{title}" }),
            cancel: tc("cancel"),
            failed: tc("unavailable"),
            open: tc("open"),
          }}
        />
      ),
    };
  });

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colRecord"), always: true },
    { key: "deletedBy", label: t("colDeletedBy") },
    { key: "left", label: t("colLeft") },
    { key: "deleted", label: t("colDeleted") },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <AdminDataTable
        listKey="trash"
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

/** Admin › Trash (D0 R4) on the shared DataTable (issue 229): deleted records for 30 days, then gone for good. */
export default function TrashPage(props: PageProps<"/[locale]/secure-admin-control/trash">) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <Trash searchParams={props.searchParams} />
    </Suspense>
  );
}
