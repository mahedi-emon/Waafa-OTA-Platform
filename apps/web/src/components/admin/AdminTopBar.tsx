"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, KeyRound, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/lib/admin/sessionActions";
import { AdminCommand } from "./AdminCommand";
import { AdminNewMenu } from "./AdminNewMenu";
import { AdminNotifications } from "./AdminNotifications";
import { useAdminNav } from "./AdminNavContext";

/**
 * The top bar (ADMIN.md §3.2): menu toggle, search (Ctrl K), + New, notifications, View site and the account menu.
 * Sticky, white, 64 px; on phones the search becomes an icon and View site moves into the account menu.
 */
function AdminTopBar() {
  const t = useTranslations("Admin.shell");
  const { staff } = useAdminNav();
  const { toggleSidebar, open, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-1.5 border-b border-mist-200 bg-white/95 px-2 backdrop-blur-sm sm:gap-2 md:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={isMobile ? t("menu") : open ? t("collapse") : t("expand")}
        className="shrink-0 text-navy-900 lg:size-10"
      >
        <PanelLeft aria-hidden="true" className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <AdminCommand />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <AdminNewMenu />
        <AdminNotifications />
        <Button asChild variant="secondary" size="sm" className="hidden xl:inline-flex">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" className="size-4" />
            {t("viewSite")}
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${t("account")}: ${staff.name}`}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-navy-900 text-[13px] font-bold text-white transition-colors duration-150 hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none lg:size-10"
            >
              {staff.initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
              <span className="truncate text-[14.5px] font-semibold text-navy-900">
                {staff.name}
              </span>
              <span className="truncate text-[13px] font-normal text-mist-600">
                {staff.roleName}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/secure-admin-control/account" prefetch={false}>
                <KeyRound aria-hidden="true" />
                {t("account")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="xl:hidden">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" />
                {t("viewSite")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOut aria-hidden="true" />
                  {t("signOut")}
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { AdminTopBar };
