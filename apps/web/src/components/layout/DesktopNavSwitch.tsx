"use client";

import { lazy, Suspense, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import type { DesktopNav as DesktopNavComponent } from "./DesktopNav";

const DesktopNav = lazy(() => import("./DesktopNav").then((mod) => ({ default: mod.DesktopNav })));

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktop(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type DesktopNavSwitchProps = ComponentProps<typeof DesktopNavComponent> & {
  /** The server-rendered plain-link nav, shown on phones, during hydration and while the menu loads. */
  fallback: ReactNode;
};

/**
 * Loads the Radix navigation menu (hover panels, keyboard roving) only on screens of 1024 px and wider (issue 91);
 * phones never download it. Server rendering and hydration use the plain-link fallback.
 */
function DesktopNavSwitch({ fallback, ...props }: DesktopNavSwitchProps) {
  const desktop = useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
  if (!desktop) return fallback;
  return (
    <Suspense fallback={fallback}>
      <DesktopNav {...props} />
    </Suspense>
  );
}

export { DesktopNavSwitch };
