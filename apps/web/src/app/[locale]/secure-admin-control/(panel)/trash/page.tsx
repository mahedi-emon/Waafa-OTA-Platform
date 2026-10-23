import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { RelativeTime } from "@/components/admin/RelativeTime";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { pageParam } from "@/lib/admin/format";
import type { Paged, TrashRow } from "@/lib/admin/types";
import { TrashActions } from "./_components/TrashActions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.trash");
  return { title: t("metaTitle") };
}

const DAY = 86_400_000;
const capital = (words: string) => words.charAt(0).toUpperCase() + words.slice(1);

async function Trash({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/trash">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const [staff, list, t, tc, tb] = await Promise.all([
    requireStaff(),
    adminGet<Paged<TrashRow>>("/admin/trash", { page, pageSize: 25 }),
    getTranslations("Admin.trash"),
    getTranslations("Admin.common"),
    getTranslations("Admin.blueprints"),
  ]);
  // Record nouns are looked up by the record's list, so this translator is used untyped.
  const nouns = tb as unknown as ((key: string) => string) & { has: (key: string) => boolean };
  const noun = (key: string) => (nouns.has(`${key}.one`) ? capital(nouns(`${key}.one`)) : key);
  const canPurge = hasRole(staff, "super-admin");
  const now = new Date().getTime();

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        {list.items.length === 0 ? (
          <AdminEmpty title={t("emptyTitle")} body={t("emptyBody")} />
        ) : (
          <ul className="divide-y divide-mist-100">
            {list.items.map((item) => {
              const days = Math.max(0, Math.ceil((Date.parse(item.purgeAt) - now) / DAY));
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-mist-600">
                      {noun(item.collection)}
                    </p>
                    <p className="mt-0.5 font-semibold wrap-break-word text-navy-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] text-mist-600">
                      {t.rich("deleted", {
                        when: () => <RelativeTime iso={item.deletedAt} />,
                        name: item.deletedBy,
                      })}{" "}
                      · {t("daysLeft", { count: days })}
                    </p>
                  </div>
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
                </li>
              );
            })}
          </ul>
        )}
        <AdminPagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          path="/secure-admin-control/trash"
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

/** Admin › Trash (D0 R4): deleted records for 30 days, then gone for good. */
export default function TrashPage(props: PageProps<"/[locale]/secure-admin-control/trash">) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <Trash searchParams={props.searchParams} />
    </Suspense>
  );
}
