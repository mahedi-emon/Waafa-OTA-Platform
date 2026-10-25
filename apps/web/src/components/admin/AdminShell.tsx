import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { InboxSummary, Role } from "@waafa/shared";
import { Toaster } from "@/components/ui/sonner";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, type StaffSession } from "@/lib/admin/adminApi";
import { initialsOf } from "@/lib/admin/format";
import { SETTINGS_ITEM, allItems, canSee, navFor, newRecordsFor } from "@/lib/admin/navigation";
import { AdminBrand } from "./AdminBrand";
import { AdminFrame } from "./AdminFrame";

const ROLE_ORDER: Role[] = [
  "super-admin",
  "admin",
  "travel-sales",
  "visa-officer",
  "shop-manager",
  "content-editor",
  "accounts",
];

/** Strings the frame's client leaves render (sidebar, top bar, bell, Ctrl K); nothing else leaves the server. */
const FRAME_MESSAGES = [
  "Admin.shell",
  "Admin.nav",
  "Admin.navHelp",
  "Admin.newMenu",
  "Admin.bell",
  "Admin.counts",
  "Admin.command",
  "Admin.content.keys",
  "Admin.states",
  "Admin.editor.session",
];

type AdminShellProps = { staff: StaffSession; children: ReactNode };

/**
 * The admin frame (ADMIN.md §3): the grouped midnight sidebar with count badges (folds to icons, a sheet below
 * 1024 px), the top bar with Ctrl K, + New and notifications, and the page. Filtered by the person's roles; what waits
 * for them is rendered with the page and then polled every 30 s.
 */
async function AdminShell({ staff, children }: AdminShellProps) {
  const [t, messages, store, initialInbox] = await Promise.all([
    getTranslations("Admin"),
    getMessages(),
    cookies(),
    adminGet<InboxSummary>("/admin/inbox").catch(() => null),
  ]);
  const groups = navFor(staff.roles);
  const mainRole = ROLE_ORDER.find((role) => staff.roles.includes(role)) ?? "travel-sales";

  return (
    <NextIntlClientProvider messages={pickMessagePaths(messages, FRAME_MESSAGES)}>
      <AdminFrame
        nav={{
          groups,
          items: allItems(groups, staff.roles),
          settings: canSee(staff.roles, SETTINGS_ITEM) ? SETTINGS_ITEM : null,
          newRecords: newRecordsFor(staff.roles),
          staff: {
            name: staff.name,
            initials: initialsOf(staff.name),
            roleName: t(`users.roleNames.${mainRole}`),
            roles: staff.roles,
          },
          initialInbox,
        }}
        brand={
          <AdminBrand name={t("brand.name")} sub={t("brand.sub")} markLabel={t("brand.name")} />
        }
        sidebarOpen={store.get("sidebar_state")?.value !== "false"}
        offlineMessage={t("shell.offline")}
      >
        {children}
      </AdminFrame>
      {/* Toasts sit above the editors' sticky action bar, so a toast never covers Save, Schedule or Publish. */}
      <Toaster
        aboveTabBar={false}
        offset={{ bottom: 96, right: 24 }}
        mobileOffset={{ bottom: 92, left: 16, right: 16 }}
      />
    </NextIntlClientProvider>
  );
}

export { AdminShell };
