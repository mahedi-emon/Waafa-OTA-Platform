import { Check, Minus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Role } from "@waafa/shared";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { ADMIN_NAV, canSee } from "@/lib/admin/navigation";
import { SETTINGS_SECTIONS, canOpenTab } from "@/lib/admin/settingsSections";

const ROLES: Role[] = [
  "super-admin",
  "admin",
  "travel-sales",
  "visa-officer",
  "shop-manager",
  "content-editor",
  "accounts",
];

type PermissionMatrixProps = { roleNames: Record<Role, string> };

/**
 * Who can open what, read-only (ADMIN.md §5.6): every sidebar screen and settings section against every role, from
 * the same rules the sidebar and the API use, so it can never disagree with them.
 */
async function PermissionMatrix({ roleNames }: PermissionMatrixProps) {
  const [t, tn, ts] = await Promise.all([
    getTranslations("Admin.users.matrix"),
    getTranslations("Admin.nav"),
    getTranslations("Admin.settingsIndex.sections"),
  ]);
  const groups = [
    ...ADMIN_NAV.map((group) => ({
      label: tn(group.label as "home"),
      rows: group.items.map((item) => ({
        key: item.key,
        label: tn(item.label as "dashboard"),
        can: (role: Role) => canSee([role], item),
      })),
    })),
    {
      label: tn("settings"),
      rows: SETTINGS_SECTIONS.map((section) => ({
        key: `settings-${section.id}`,
        label: ts(`${section.id}.title`),
        can: (role: Role) => section.tabs.some((tab) => canOpenTab([role], tab)),
      })),
    },
  ];

  return (
    <AdminPanel title={t("title")} lead={t("lead")} flush className="mt-8">
      {/* A wide table scrolls on its own on narrow screens; keyboard users reach it with Tab and scroll with the arrows. */}
      <div
        role="region"
        aria-label={t("caption")}
        tabIndex={0}
        className="relative overflow-x-auto border-t border-mist-100 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <table className="w-full min-w-[760px] border-collapse text-[13.5px]">
          <caption className="sr-only">{t("caption")}</caption>
          <thead>
            <tr className="border-b border-mist-200 text-left">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-white px-5 py-3 font-semibold text-navy-900"
              >
                {t("screen")}
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  scope="col"
                  className="px-2 py-3 text-center font-semibold text-navy-900"
                >
                  {roleNames[role]}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.label}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={ROLES.length + 1}
                  className="bg-mist-25 px-5 py-2 text-left text-[12.5px] font-semibold text-mist-700"
                >
                  {group.label}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.key} className="border-b border-mist-100 last:border-b-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-white px-5 py-2.5 text-left font-medium text-ink-900"
                  >
                    {row.label}
                  </th>
                  {ROLES.map((role) => {
                    const yes = row.can(role);
                    return (
                      <td key={role} className="relative px-2 py-2.5 text-center">
                        {yes ? (
                          <Check aria-hidden="true" className="mx-auto size-4 text-success-600" />
                        ) : (
                          <Minus aria-hidden="true" className="mx-auto size-4 text-mist-300" />
                        )}
                        <span className="sr-only">{yes ? t("yes") : t("no")}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </AdminPanel>
  );
}

export { PermissionMatrix };
