"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "cn";
import markImage from "@/assets/brand/waafa-mark.png";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Link } from "@/i18n/navigation";
import { CurrentMarker } from "./CurrentMarker";
import { isActivePath } from "./isActivePath";
import { WithPathname } from "./WithPathname";

type TabItem = {
  id: string;
  label: string;
  href?: string;
  panel?: "shop" | "more";
  icon: ReactNode;
};

type TabBarProps = {
  /** Exactly five tabs from the "tabbar" menu: the third is Waafas World, the fifth opens More. */
  items: TabItem[];
  /** Server-rendered More sheet body (grid + call and WhatsApp buttons). */
  moreSheet: ReactNode;
  labels: {
    nav: string;
    moreTitle: string;
    moreDescription: string;
    close: string;
    current: string;
  };
};

const TAB_CLASS =
  "group/tab flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 px-0.5 text-center text-mist-600 outline-none select-none focus-visible:bg-mist-50 has-[[data-current]]:text-navy-900";

/**
 * Phone bottom tab bar (TabBar board, correction 3): Home, Packages, Waafas World on a raised W disc, Visa, More.
 * The store label always reads "Waafas World" and may wrap to two lines at 320 px, never cut. One indicator slides
 * under the current tab (CSS transform); More opens a bottom sheet with drag-to-close above the bar. The tabs never
 * re-mount after hydration: only the indicator and the current-page markers read the pathname.
 */
function TabBar({ items, moreSheet, labels }: TabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreIndex = items.findIndex((item) => item.panel === "more");

  function indicator(pathname: string | null) {
    const index = moreOpen
      ? moreIndex
      : items.findIndex((item) => isActivePath(pathname, item.href));
    return (
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 left-0 flex w-1/5 justify-center transition-[transform,opacity] duration-300 ease-out",
          index < 0 && "opacity-0",
        )}
        style={{ transform: `translateX(${Math.max(index, 0) * 100}%)` }}
      >
        <span className="h-[3px] w-8 rounded-b-full bg-electric-600" />
      </span>
    );
  }

  return (
    <>
      <nav
        aria-label={labels.nav}
        className={cn(
          "fixed inset-x-0 bottom-0 border-t border-mist-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_28px_-22px_rgb(2_13_57/0.35)] backdrop-blur-md lg:hidden",
          // Above the More sheet's overlay while it is open, so the tabs stay visible and usable (TabBar board).
          moreOpen ? "z-[60]" : "z-40",
        )}
      >
        <div className="relative mx-auto grid h-(--tab-h) max-w-xl grid-cols-5">
          <WithPathname>{indicator}</WithPathname>

          {items.map((item, index) => {
            const store = index === 2;
            const face = store ? (
              <>
                <span className="-mt-7 grid size-14 place-items-center rounded-full bg-white shadow-lg ring-2 ring-electric-100 transition-transform duration-150 group-active/tab:scale-95 group-has-[[data-current]]/tab:ring-electric-600">
                  <Image src={markImage} alt="" width={33} height={20} className="h-5 w-[33px]" />
                </span>
                <span className="max-w-[72px] text-[11px] leading-[1.1] font-semibold">
                  {item.label}
                </span>
              </>
            ) : (
              <>
                <span className="transition-transform duration-150 group-active/tab:scale-90 [&_svg]:size-[22px]">
                  {item.icon}
                </span>
                <span className="text-[11px] leading-none font-semibold">{item.label}</span>
              </>
            );

            if (item.panel === "more") {
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                  onClick={() => setMoreOpen(true)}
                  className={cn(TAB_CLASS, moreOpen && "text-navy-900")}
                >
                  {face}
                </button>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.href ?? "/"}
                onClick={() => setMoreOpen(false)}
                className={TAB_CLASS}
              >
                {face}
                {moreOpen ? null : <CurrentMarker href={item.href} label={labels.current} />}
              </Link>
            );
          })}
        </div>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="rounded-t-[28px] border-0 bg-white data-[vaul-drawer-direction=bottom]:bottom-(--tab-space) lg:hidden">
          <div className="flex items-center justify-between px-5 pt-2">
            <DrawerTitle className="font-display text-[20px] font-bold text-navy-900">
              {labels.moreTitle}
            </DrawerTitle>
            <DrawerClose
              aria-label={labels.close}
              className="grid size-11 cursor-pointer place-items-center rounded-full text-navy-900 outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              <X aria-hidden="true" className="size-6" />
            </DrawerClose>
          </div>
          <DrawerDescription className="sr-only">{labels.moreDescription}</DrawerDescription>
          <div
            className="overflow-y-auto px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]"
            onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a[href^='/']")) setMoreOpen(false);
            }}
          >
            {moreSheet}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export { TabBar };
