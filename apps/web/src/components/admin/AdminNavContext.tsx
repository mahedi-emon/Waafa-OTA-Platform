"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { InboxSummary, Role } from "@waafa/shared";
import type { AdminNavGroup, AdminNavItem, NewRecordGroup } from "@/lib/admin/navigation";

export type AdminStaff = { name: string; initials: string; roleName: string; roles: Role[] };

export type AdminNavData = {
  groups: AdminNavGroup[];
  /** Every item in order, Settings last (active state, breadcrumbs, Ctrl+K). */
  items: AdminNavItem[];
  settings: AdminNavItem | null;
  newRecords: NewRecordGroup[];
  staff: AdminStaff;
  /** What waited when the page was rendered; the poller keeps it fresh. */
  initialInbox: InboxSummary | null;
};

const AdminNavContext = createContext<AdminNavData | null>(null);

/** The signed-in person's navigation, shared by the sidebar, top bar, breadcrumbs and command palette. */
function AdminNavProvider({ value, children }: { value: AdminNavData; children: ReactNode }) {
  return <AdminNavContext.Provider value={value}>{children}</AdminNavContext.Provider>;
}

function useAdminNav(): AdminNavData {
  const value = useContext(AdminNavContext);
  if (!value) throw new Error("useAdminNav must be used inside the admin frame");
  return value;
}

/** Optional variant for leaves that may render outside the frame (sign-in page). */
function useOptionalAdminNav(): AdminNavData | null {
  return useContext(AdminNavContext);
}

export { AdminNavProvider, useAdminNav, useOptionalAdminNav };
