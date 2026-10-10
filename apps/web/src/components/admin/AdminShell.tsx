import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Role } from "@waafa/shared";
import { Toaster } from "@/components/ui/sonner";
import type { StaffSession } from "@/lib/admin/adminApi";
import { initialsOf } from "@/lib/admin/format";
import { ADMIN_NAV, navFor } from "@/lib/admin/navigation";
import { signOut } from "@/lib/admin/sessionActions";
import { AdminBrand } from "./AdminBrand";
import { AdminNav } from "./AdminNav";
import { AdminTopBar } from "./AdminTopBar";

const ROLE_ORDER: Role[] = [
  "super-admin",
  "admin",
  "travel-sales",
  "visa-officer",
  "shop-manager",
  "content-editor",
  "accounts",
];

type AdminShellProps = { staff: StaffSession; children: ReactNode };

/**
 * The admin frame (AdminSide + AdminTop boards): the navy sidebar from 1024 px (a sheet on phones), the top bar with
 * Ctrl K search and the account menu, and the page. Navigation is filtered by the person's roles.
 */
async function AdminShell({ staff, children }: AdminShellProps) {
  const t = await getTranslations("Admin");
  const groups = navFor(staff.roles);
  const labels: Record<string, string> = {};
  for (const group of ADMIN_NAV) {
    labels[group.label] = t(`nav.${group.label}` as "nav.overview");
    for (const item of group.items) labels[item.label] = t(`nav.${item.label}` as "nav.overview");
  }
  const mainRole = ROLE_ORDER.find((role) => staff.roles.includes(role)) ?? "travel-sales";
  const roleName = t(`users.roleNames.${mainRole}`);
  const initials = initialsOf(staff.name);
  const brand = <AdminBrand name={t("brand.name")} sub={t("brand.sub")} />;

  return (
    <div className="min-h-dvh bg-mist-50 lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-navy-900 text-white lg:flex">
        {brand}
        <div className="flex-1">
          <AdminNav groups={groups} labels={labels} label={t("shell.nav")} />
        </div>
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-electric-600 text-sm font-bold">
            {initials}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <b className="truncate text-[14px] font-semibold">{staff.name}</b>
            <small className="truncate text-[12px] text-white/60">{roleName}</small>
          </span>
          <form action={signOut}>
            <button
              type="submit"
              aria-label={t("shell.signOut")}
              className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              <LogOut aria-hidden="true" className="size-[18px]" />
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <AdminTopBar
          groups={groups}
          labels={labels}
          staff={{ name: staff.name, initials, role: roleName }}
          brand={brand}
          brandSub={t("brand.sub")}
          strings={{
            menu: t("shell.menu"),
            nav: t("shell.nav"),
            viewSite: t("shell.viewSite"),
            account: t("shell.account"),
            signOut: t("shell.signOut"),
            command: {
              search: t("shell.search"),
              searchShort: t("shell.searchShort"),
              title: t("shell.commandTitle"),
              empty: t("shell.commandEmpty"),
              pages: t("shell.commandGroupPages"),
              find: t("shell.commandGroupFind"),
              openReference: t("shell.commandLead"),
              referenceHint: t("shell.commandLeadHint"),
            },
          }}
        />
        <main id="main" className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export { AdminShell };
