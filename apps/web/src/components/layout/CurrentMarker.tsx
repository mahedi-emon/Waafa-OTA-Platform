"use client";

import { cn } from "cn";
import { isActivePath } from "./isActivePath";
import { WithPathname } from "./WithPathname";

type CurrentMarkerProps = {
  href?: string;
  /** Read after the link text by screen readers, e.g. "current page". */
  label: string;
  /** Classes for the visible marker (a bar under a nav item); omit for no visible marker. */
  barClassName?: string;
};

/**
 * Marks the link for the current section. Only this small leaf reads the pathname (after hydration), so the link or
 * button around it never re-mounts and keeps focus. Parents style themselves with
 * `has-[[data-current]]:…`; screen readers hear "<label> (current page)".
 */
function CurrentMarker({ href, label, barClassName }: CurrentMarkerProps) {
  return (
    <WithPathname>
      {(pathname) =>
        isActivePath(pathname, href) ? (
          <>
            {barClassName ? (
              <span aria-hidden="true" data-current="" className={cn("absolute", barClassName)} />
            ) : (
              <span aria-hidden="true" data-current="" className="hidden" />
            )}
            <span className="sr-only"> ({label})</span>
          </>
        ) : null
      }
    </WithPathname>
  );
}

export { CurrentMarker };
