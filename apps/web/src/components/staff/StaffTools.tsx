"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Ellipsis, EyeOff, LayoutDashboard, LogOut, Pencil, SquareDashed } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exitPreviewHref } from "@/lib/admin/preview";
import { STAFF_HINT_COOKIE } from "@/lib/staffHint";
import { SectionOutlines } from "./SectionOutlines";
import type { StaffToolsData } from "./staffToolsTypes";

const HIDDEN_KEY = "waafa:staff-tools-hidden";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function readHidden(): boolean {
  try {
    return window.sessionStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function readPreview(): boolean {
  return /(?:^|;\s*)waafa_preview=1(?:;|$)/.test(document.cookie);
}

const BUTTON =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-cyan-400/60 focus-visible:outline-none";

/**
 * The public site's staff tools (D0 R7), loaded only in a signed-in browser: Edit this page opens the screen behind
 * the page (or the record's editor), Edit sections outlines the home sections with a link to each one's sheet, and
 * Exit preview ends Preview of unpublished changes. Bottom left, clear of the WhatsApp button and the tab bar.
 */
function StaffTools() {
  const pathname = usePathname();
  const [loaded, setLoaded] = useState<{ path: string; data: StaffToolsData | null } | null>(null);
  const [outlines, setOutlines] = useState(false);
  const [hasSections, setHasSections] = useState(false);
  const hidden = useSyncExternalStore(subscribe, readHidden, () => true);
  const preview = useSyncExternalStore(subscribe, readPreview, () => false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/secure-admin-control/api/staff-tools?path=${encodeURIComponent(pathname)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          // The session has ended: the next pages stop loading the tools.
          document.cookie = `${STAFF_HINT_COOKIE}=; Max-Age=0; path=/`;
        }
        const data = response.ok ? ((await response.json()) as StaffToolsData) : null;
        setLoaded({ path: pathname, data });
      })
      .catch(() => {
        // Offline or aborted: no tools on this page.
      });
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    if (!outlines) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOutlines(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [outlines]);

  const data = loaded?.path === pathname ? loaded.data : null;
  if (hidden || !data) return null;
  const { labels } = data;
  const canOutline = Object.keys(data.sections).length > 0;

  const hide = () => {
    try {
      window.sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // Storage blocked: the tools stay; nothing else to do.
    }
    setOutlines(false);
    for (const listener of listeners) listener();
  };

  return (
    <>
      <div
        role="region"
        aria-label={labels.region}
        className="fixed bottom-[calc(var(--tab-space)+16px)] left-4 z-30 flex items-center gap-0.5 rounded-full bg-midnight-950/95 p-1 shadow-[0_14px_30px_-14px_rgb(2_13_57/0.8)] ring-1 ring-white/10 lg:bottom-7 lg:left-7 [body:has([data-bottom-bar])_&]:bottom-[calc(var(--tab-space)+84px)] lg:[body:has([data-bottom-bar])_&]:bottom-7"
      >
        <a
          href={data.edit ?? "/secure-admin-control"}
          className={`${BUTTON} min-w-11 px-3 sm:px-4`}
        >
          {data.edit ? (
            <Pencil aria-hidden="true" className="size-4" />
          ) : (
            <LayoutDashboard aria-hidden="true" className="size-4" />
          )}
          <span className="max-sm:sr-only">{data.edit ? labels.edit : labels.admin}</span>
        </a>
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) setHasSections(document.querySelector("[data-edit]") !== null);
          }}
        >
          <DropdownMenuTrigger aria-label={labels.more} className={`${BUTTON} size-11`}>
            <Ellipsis aria-hidden="true" className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-auto min-w-56">
            {canOutline && hasSections ? (
              <DropdownMenuCheckboxItem
                checked={outlines}
                onCheckedChange={(checked) => setOutlines(checked === true)}
                className="min-h-11"
              >
                <SquareDashed aria-hidden="true" className="size-4" />
                {labels.editSections}
              </DropdownMenuCheckboxItem>
            ) : null}
            {preview ? (
              <DropdownMenuItem asChild className="min-h-11">
                <a href={exitPreviewHref(pathname)}>
                  <LogOut aria-hidden="true" className="size-4" />
                  {labels.exitPreview}
                </a>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={hide} className="min-h-11">
              <EyeOff aria-hidden="true" className="size-4" />
              {labels.hide}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {outlines && canOutline ? <SectionOutlines labels={data.sections} /> : null}
    </>
  );
}

export { StaffTools };
