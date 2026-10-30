"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { adminThemeCookie, type AdminTheme } from "@/lib/admin/adminTheme";

type AdminThemeValue = { theme: AdminTheme; setTheme: (theme: AdminTheme) => void };

const AdminThemeContext = createContext<AdminThemeValue | null>(null);

/**
 * The admin's theme (issue 257): the frame renders `data-admin-theme` from the cookie, and a change from the account
 * menu applies at once and is remembered. globals.css maps the WAAFA colours to their dark values while the attribute
 * says so (or says "system" and the device is dark).
 */
function AdminThemeProvider({
  initial,
  children,
}: {
  initial: AdminTheme;
  children: (theme: AdminTheme) => ReactNode;
}) {
  const [theme, setThemeState] = useState(initial);
  const setTheme = (next: AdminTheme) => {
    document.cookie = adminThemeCookie(next);
    setThemeState(next);
  };
  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      {children(theme)}
    </AdminThemeContext.Provider>
  );
}

function useAdminTheme(): AdminThemeValue {
  const value = useContext(AdminThemeContext);
  if (!value) throw new Error("useAdminTheme must be used inside the admin frame");
  return value;
}

export { AdminThemeProvider, useAdminTheme };
