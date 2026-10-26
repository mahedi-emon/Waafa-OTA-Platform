import { Suspense } from "react";
import type { Metadata } from "next";
import { ChevronRight } from "@/components/icons/serverIcons";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { adminGet } from "@/lib/admin/adminApi";
import { CONTENT_GROUPS, keysInGroup, type ContentGroupKey } from "@/lib/admin/contentGroups";
import type { ContentOverviewItem } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("metaTitle") };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Overview({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/content">["searchParams"];
}) {
  const params = await searchParams;
  const [items, t] = await Promise.all([
    adminGet<ContentOverviewItem[]>("/admin/content"),
    getTranslations("Admin.content"),
  ]);
  const visible = items.map((item) => item.key);
  const groups = CONTENT_GROUPS.filter((group) => keysInGroup(group, visible).length > 0);
  const requested = CONTENT_GROUPS.find((group) => group === one(params.group));
  const shownGroups: ContentGroupKey[] =
    requested && groups.includes(requested) ? [requested] : groups;
  const byKey = new Map(items.map((item) => [item.key, item]));

  return (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <StatusTabs
        label={t("title")}
        current={requested ?? "all"}
        items={[
          { value: "all", label: t("title"), href: "/secure-admin-control/content" },
          ...groups.map((group) => ({
            value: group,
            label: t(`groups.${group}`),
            href: `/secure-admin-control/content?group=${group}`,
          })),
        ]}
      />
      <div className="flex flex-col gap-6">
        {shownGroups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 font-display text-[18px] font-bold text-navy-900">
              {t(`groups.${group}`)}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {keysInGroup(group, visible).map((key) => {
                const item = byKey.get(key);
                return (
                  <li key={key}>
                    <Link
                      href={`/secure-admin-control/content/${key}`}
                      prefetch={false}
                      className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-mist-200 bg-white px-5 py-4 transition-colors duration-150 hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-navy-900">
                          {t(`keys.${key}`)}
                        </span>
                        <span className="block text-[13px] text-mist-600">
                          {item?.kind === "collection"
                            ? t("records", { count: item.count ?? 0 })
                            : t("setting")}
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-mist-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

/** Every content area this person may edit (AdminPages, AdminHome, AdminGeneral … through one editor, D138). */
export default function ContentOverviewPage(
  props: PageProps<"/[locale]/secure-admin-control/content">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[560px] rounded-2xl" />}>
      <Overview searchParams={props.searchParams} />
    </Suspense>
  );
}
