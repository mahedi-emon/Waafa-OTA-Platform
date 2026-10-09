"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "waafa:announcement-dismissed";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readDismissed(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

type AnnouncementShellProps = {
  id: string;
  dismissLabel: string;
  children: ReactNode;
};

/**
 * Keeps the server-rendered announcement visible until the visitor dismisses it; the choice is remembered per
 * announcement id, so a new announcement shows again (FR-GLB-03).
 */
function AnnouncementShell({ id, dismissLabel, children }: AnnouncementShellProps) {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => null) === id;
  if (dismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage blocked (private mode): hide for this page view only.
    }
    for (const listener of listeners) listener();
  }

  return (
    <div className="relative z-50 bg-midnight-950 text-white">
      <div className="site-container flex min-h-10 items-center gap-2 py-1.5 pr-1">
        <div className="flex-1 text-center text-[13px] leading-snug md:text-[13.5px]">
          {children}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={dismissLabel}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-cyan-400/60"
        >
          <X aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

export { AnnouncementShell };
