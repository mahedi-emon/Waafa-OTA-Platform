import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminGet } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import { removeSubscriber } from "@/lib/admin/opsActions";
import type { Paged, SubscriberRow } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.subscribers");
  return { title: t("metaTitle") };
}

async function Subscribers({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/subscribers">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const [list, t, tc] = await Promise.all([
    adminGet<Paged<SubscriberRow>>("/admin/subscribers", { page, pageSize: 50 }),
    getTranslations("Admin.subscribers"),
    getTranslations("Admin.common"),
  ]);
  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <Table scrollLabel={t("title")}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("colEmail")}</TableHead>
                <TableHead>{t("colSource")}</TableHead>
                <TableHead>{t("colWhen")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("remove")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="break-all">{row.email}</TableCell>
                  <TableCell className="text-mist-600">{row.source ?? ""}</TableCell>
                  <TableCell className="text-[13px] whitespace-nowrap text-mist-600">
                    {formatDhakaDateTime(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionButton
                      action={removeSubscriber.bind(null, row.id)}
                      success={t("removed")}
                      failed={tc("unavailable")}
                      variant="ghost"
                      confirm={`${t("remove")} ${row.email}?`}
                    >
                      {t("remove")}
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/secure-admin-control/subscribers"
          query={{}}
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

/** Newsletter list (Marketing, FR-FTR-05). */
export default function SubscribersPage(
  props: PageProps<"/[locale]/secure-admin-control/subscribers">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl" />}>
      <Subscribers searchParams={props.searchParams} />
    </Suspense>
  );
}
