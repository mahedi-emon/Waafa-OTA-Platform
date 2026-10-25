import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/admin/adminApi";
import { settingsFor, tabHref, type SettingsSectionId } from "@/lib/admin/settingsSections";
import { SettingsTabs } from "./SettingsTabs";

type SettingsSectionTabsProps = {
  section: SettingsSectionId;
  current: string;
  sectionTitle: string;
};

/** The parts of a settings section this person may open, as tabs (also on screens like Sent messages). */
async function SettingsSectionTabs({
  section: id,
  current,
  sectionTitle,
}: SettingsSectionTabsProps) {
  const [staff, t] = await Promise.all([requireStaff(), getTranslations("Admin.settingsIndex")]);
  const section = settingsFor(staff.roles).find((candidate) => candidate.id === id);
  if (!section) return null;
  return (
    <SettingsTabs
      label={t("partsOf", { section: sectionTitle })}
      current={current}
      tabs={section.tabs.map((part) => ({
        id: part.id,
        href: tabHref(section, part),
        label: t(`tabs.${part.id}` as "tabs.contact"),
      }))}
    />
  );
}

export { SettingsSectionTabs };
