"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { useHydrated } from "@/lib/useHydrated";

type Render = (pathname: string | null) => ReactNode;

function PathnameReader({ children }: { children: Render }) {
  return children(usePathname());
}

/**
 * Active-link state for navs in shared layouts. Reading the pathname while Next.js prerenders the static App Shell
 * would suspend the whole layout (Cache Components), so the shell renders with `null` (no active item) and the
 * pathname is read right after hydration. Only the nav re-renders; nothing shifts.
 */
function WithPathname({ children }: { children: Render }) {
  const hydrated = useHydrated();
  return hydrated ? <PathnameReader>{children}</PathnameReader> : children(null);
}

export { WithPathname };
