"use client";

import type { MouseEvent, ReactNode } from "react";
import { cn } from "cn";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { CurrentMarker } from "./CurrentMarker";

type DesktopNavItem = { id: string; label: string; href?: string; panel?: "shop" | "more" };

type DesktopNavProps = {
  items: DesktopNavItem[];
  /** Server-rendered panel bodies. */
  shopPanel: ReactNode;
  morePanel: ReactNode;
  label: string;
  /** Screen-reader suffix for the current section, e.g. "current page". */
  currentLabel: string;
  className?: string;
};

/** The current section gets navy, semibold text and a 2 px electric bar under the label (Header board). */
const CURRENT_TEXT = "has-[[data-current]]:font-semibold has-[[data-current]]:text-navy-900";
const CURRENT_BAR = "inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-electric-600";

/**
 * Desktop header navigation (≥ 1024 px): seven items from the header menu. "Waafas World" and "More" open panels on
 * hover or keyboard; a pointer click on "Waafas World" still opens the store (PRD §6). Panels span the header
 * container (items are `static`), so the mega panel can be wider than the nav.
 */
function DesktopNav({
  items,
  shopPanel,
  morePanel,
  label,
  currentLabel,
  className,
}: DesktopNavProps) {
  const router = useRouter();

  function openStoreOnClick(event: MouseEvent<HTMLButtonElement>, href?: string) {
    // `detail` is 0 for keyboard activation: Enter and Space open the panel instead of navigating.
    if (href && event.detail > 0) router.push(href);
  }

  // Radix wraps the list in a relative div; [&>div]:static! lets panels position against the header container.
  return (
    <NavigationMenu
      viewport={false}
      aria-label={label}
      delayDuration={120}
      className={cn("static max-w-none flex-none [&>div]:static!", className)}
    >
      <NavigationMenuList>
        {items.map((item) => {
          if (item.panel) {
            return (
              <NavigationMenuItem key={item.id} value={item.id} className="static">
                <NavigationMenuTrigger
                  onClick={(event) => openStoreOnClick(event, item.href)}
                  className={CURRENT_TEXT}
                >
                  {item.label}
                  <CurrentMarker href={item.href} label={currentLabel} barClassName={CURRENT_BAR} />
                </NavigationMenuTrigger>
                <NavigationMenuContent
                  className={cn(
                    "z-50",
                    item.panel === "shop"
                      ? "left-1/2 -translate-x-1/2 md:w-[min(1100px,calc(100vw-48px))]"
                      : "right-4 left-auto md:right-7 md:w-[640px] xl:right-10",
                  )}
                >
                  {item.panel === "shop" ? shopPanel : morePanel}
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          if (!item.href) return null;
          return (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuLink asChild>
                <Link href={item.href} className={cn(navigationMenuTriggerStyle(), CURRENT_TEXT)}>
                  {item.label}
                  <CurrentMarker href={item.href} label={currentLabel} barClassName={CURRENT_BAR} />
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export { DesktopNav };
