import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/admin/adminApi";
import {
  SETTINGS_SECTIONS,
  settingsFor,
  type SettingsSectionId,
} from "@/lib/admin/settingsSections";
import { SettingsNav } from "./SettingsNav";

type SettingsFrameProps = {
  /** The section on screen, highlighted in the sub-navigation. */
  current?: SettingsSectionId;
  children: ReactNode;
};

/** The section titles in the person's language, for the sub-navigation and the settings home. */
export async function settingsTitles(): Promise<Record<SettingsSectionId, string>> {
  const t = await getTranslations("Admin.settingsIndex.sections");
  return Object.fromEntries(
    SETTINGS_SECTIONS.map((section) => [section.id, t(`${section.id}.title`)]),
  ) as Record<SettingsSectionId, string>;
}

/**
 * Settings as one page (ADMIN.md §5.6): the sections on the left from 1024 px, the section itself beside them. On
 * phones the settings home is the list and each section has a way back.
 */
async function SettingsFrame({ current, children }: SettingsFrameProps) {
  const [staff, titles, t] = await Promise.all([
    requireStaff(),
    settingsTitles(),
    getTranslations("Admin.settingsIndex"),
  ]);
  return (
    <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <SettingsNav
            sections={settingsFor(staff.roles)}
            current={current}
            label={t("navLabel")}
            titles={titles}
          />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export { SettingsFrame };
