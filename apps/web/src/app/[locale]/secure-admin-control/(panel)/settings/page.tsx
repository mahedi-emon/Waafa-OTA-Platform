import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SetupChecklist } from "@/components/admin/SetupChecklist";
import { SettingsFrame, settingsTitles } from "@/components/admin/settings/SettingsFrame";
import { SettingsNav } from "@/components/admin/settings/SettingsNav";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/admin/adminApi";
import { loadSetup } from "@/lib/admin/loadSetup";
import { SETTINGS_SECTIONS, settingsFor } from "@/lib/admin/settingsSections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.settingsIndex");
  return { title: t("metaTitle") };
}

async function SettingsHome() {
  const [staff, titles, steps, t] = await Promise.all([
    requireStaff(),
    settingsTitles(),
    loadSetup(),
    getTranslations("Admin.settingsIndex"),
  ]);
  const lines = Object.fromEntries(
    SETTINGS_SECTIONS.map((section) => [section.id, t(`sections.${section.id}.body`)]),
  );

  return (
    <SettingsFrame>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="flex flex-col gap-6">
        {/* Phones: the settings home is the list of sections (from 1024 px it sits on the left). */}
        <div className="lg:hidden">
          <SettingsNav
            sections={settingsFor(staff.roles)}
            label={t("navLabel")}
            titles={titles}
            variant="list"
            lines={lines}
          />
        </div>
        {steps.length > 0 ? (
          <SetupChecklist steps={steps} />
        ) : (
          <p className="hidden rounded-2xl border border-mist-200 bg-white p-5 text-[14.5px] text-mist-600 lg:block">
            {t("pick")}
          </p>
        )}
      </div>
    </SettingsFrame>
  );
}

/** Settings home (ADMIN.md §5.6): the sections and the setup checklist that ticks itself. */
export default function SettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-140 rounded-2xl" />}>
      <SettingsHome />
    </Suspense>
  );
}
