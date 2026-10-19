"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminNavProvider, type AdminNavData } from "./AdminNavContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { OfflineBanner } from "./OfflineBanner";
import { useSeedInboxSummary } from "./useInboxSummary";

type AdminFrameProps = {
  nav: AdminNavData;
  /** Server-rendered sidebar head (the one WAAFA logo). */
  brand: ReactNode;
  /** The sidebar's last state (cookie), so it renders folded or open without a jump. */
  sidebarOpen: boolean;
  offlineMessage: string;
  children: ReactNode;
};

/** The admin frame (ADMIN.md §3): sidebar + top bar + the page, sharing the person's navigation and inbox. */
function AdminFrame({ nav, brand, sidebarOpen, offlineMessage, children }: AdminFrameProps) {
  useSeedInboxSummary(nav.initialInbox);

  return (
    <AdminNavProvider value={nav}>
      <TooltipProvider delayDuration={250}>
        <SidebarProvider defaultOpen={sidebarOpen} className="bg-mist-50">
          <AdminSidebar brand={brand} />
          <div className="relative flex w-full min-w-0 flex-1 flex-col bg-mist-50">
            <AdminTopBar />
            <OfflineBanner message={offlineMessage} />
            <main
              id="main"
              tabIndex={-1}
              className="flex-1 px-4 py-6 outline-none md:px-6 lg:px-8 lg:py-8"
            >
              {children}
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </AdminNavProvider>
  );
}

export { AdminFrame };
