"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

// The palette (cmdk, the dialog, the search) loads on first use; hovering or focusing the search button warms it up.
const loadDialog = () => import("./AdminCommandDialog").then((mod) => mod.AdminCommandDialog);
const AdminCommandDialog = dynamic(loadDialog, { ssr: false });

/** Opens on Ctrl K or Cmd K anywhere, and on "/" when the focus isn't in a field. */
function useOpenShortcut(setOpen: (update: (open: boolean) => boolean) => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((open) => !open);
      } else if (
        event.key === "/" &&
        !typing &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setOpen(() => true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

/** The top bar search (ADMIN.md §3.2): a field-like button on desktop, an icon on phones, Ctrl K everywhere. */
function AdminCommand() {
  const t = useTranslations("Admin");
  const [open, setOpen] = useState(false);
  const [used, setUsed] = useState(false);

  const change = useCallback((update: (open: boolean) => boolean) => {
    setUsed(true);
    setOpen(update);
  }, []);
  useOpenShortcut(change);

  return (
    <>
      <button
        type="button"
        onClick={() => change(() => true)}
        onPointerEnter={() => void loadDialog()}
        onFocus={() => void loadDialog()}
        aria-label={t("shell.search")}
        className="flex h-11 w-full max-w-md cursor-pointer items-center gap-2.5 rounded-full border border-mist-200 bg-mist-50 px-4 text-left text-[14.5px] text-mist-600 transition-colors duration-150 hover:border-mist-300 hover:bg-white focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none max-sm:size-11 max-sm:justify-center max-sm:border-0 max-sm:bg-transparent max-sm:px-0 lg:h-10"
      >
        <Search
          aria-hidden="true"
          className="size-[18px] shrink-0 text-navy-900 sm:size-4 sm:text-mist-600"
        />
        <span className="truncate max-sm:hidden">{t("shell.search")}</span>
        <span aria-hidden="true" className="ml-auto hidden items-center gap-1 md:flex">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      {used ? <AdminCommandDialog open={open} onOpenChange={(next) => setOpen(next)} /> : null}
    </>
  );
}

export { AdminCommand };
