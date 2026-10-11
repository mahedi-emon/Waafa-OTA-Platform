"use client";

import { useRef, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { cn } from "cn";
import { useLazyOverlay } from "./useLazyOverlay";

const MobileMenuSheet = dynamic(
  () => import("./MobileMenuSheet").then((mod) => mod.MobileMenuSheet),
  { ssr: false },
);
const loadMobileMenuSheet = () => import("./MobileMenuSheet");

type MobileMenuProps = {
  /** Server-rendered LogoLockup (no tagline). */
  logo: ReactNode;
  /** Server-rendered drawer body: main links, the More grid and the contact block. */
  body: ReactNode;
  labels: { open: string; close: string; title: string; description: string };
  className?: string;
};

/**
 * Full-screen phone and tablet drawer (Home-m-drawer board). It slides in from the right with the sheet spring's
 * timing, locks scroll, returns focus to the menu button and closes itself when a link inside is followed. The
 * drawer's code loads when the browser is idle or on the first press (issue 91).
 */
function MobileMenu({ logo, body, labels, className }: MobileMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menu = useLazyOverlay(loadMobileMenuSheet);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={labels.open}
        aria-haspopup="dialog"
        aria-expanded={menu.open}
        data-state={menu.open ? "open" : "closed"}
        onClick={() => menu.setOpen(true)}
        className={cn(
          "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-navy-900 transition-colors duration-150 outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40",
          className,
        )}
      >
        <Menu aria-hidden="true" className="size-6" />
      </button>
      {menu.mounted ? (
        <MobileMenuSheet
          open={menu.open}
          onOpenChange={menu.setOpen}
          returnFocusRef={buttonRef}
          logo={logo}
          body={body}
          labels={{ close: labels.close, title: labels.title, description: labels.description }}
        />
      ) : null}
    </>
  );
}

export { MobileMenu };
