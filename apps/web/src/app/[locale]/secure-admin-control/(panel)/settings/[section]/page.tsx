import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingEditor } from "@/components/admin/settings/SettingEditor";
import { SettingsFrame, settingsTitles } from "@/components/admin/settings/SettingsFrame";
import { SettingsRecordList } from "@/components/admin/settings/SettingsRecordList";
import { SettingsSectionTabs } from "@/components/admin/settings/SettingsSectionTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/admin/adminApi";
import { settingsFor } from "@/lib/admin/settingsSections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.settingsIndex");
  return { title: t("metaTitle") };
}

type Props = PageProps<"/[locale]/secure-admin-control/settings/[section]">;

async function SettingsSectionView({
  params,
  searchParams,
}: Pick<Props, "params" | "searchParams">) {
  const [{ section: id }, search, staff, titles, t] = await Promise.all([
    params,
    searchParams,
    requireStaff(),
    settingsTitles(),
    getTranslations("Admin.settingsIndex"),
  ]);
  const section = settingsFor(staff.roles).find((candidate) => candidate.id === id);
  // An unknown section, or one this role can't open, reads as not there.
  if (!section) return <AdminNotFound />;
  const tab = section.tabs.find((candidate) => candidate.id === search.tab) ?? section.tabs[0];
  if (!tab) return <AdminNotFound />;
  // Screens with their own address (Users, Integrations, Audit log) open there, inside the same frame.
  if (tab.href) redirect(tab.href);

  return (
    <SettingsFrame current={section.id}>
      <AdminPageHeader title={titles[section.id]} lead={t(`sections.${section.id}.body`)} />
      <SettingsSectionTabs
        section={section.id}
        current={tab.id}
        sectionTitle={titles[section.id]}
      />
      {tab.setting ? (
        <SettingEditor key={tab.id} contentKey={tab.setting} sections={tab.sections} />
      ) : tab.list ? (
        <SettingsRecordList contentKey={tab.list} />
      ) : null}
    </SettingsFrame>
  );
}

/** One settings section (ADMIN.md §5.6): its parts as tabs, each a plain form with its own save bar. */
export default function SettingsSectionPage(props: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-180 rounded-2xl" />}>
      <SettingsSectionView params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
