import * as React from "react";

/** Below 1024 px the admin sidebar is a sheet: tablets keep the full width for editors (ADMIN.md §5.4). */
const MOBILE_BREAKPOINT = 1024;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** True below 1024 px; false during server render and hydration. */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
