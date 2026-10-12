import { cva } from "class-variance-authority";

/**
 * Header nav item style, shared by the Radix navigation menu and the static header nav that phones and the first
 * paint use (issue 91), so both look the same.
 */
// 6 px sides from 1024 px and 8 px from 1280 px (where the logo tagline appears) keep the header on the page grid
// with the help and Log in buttons, also with the slightly wider Linux fonts (issues 140 and 142).
export const navigationMenuTriggerStyle = cva([
  "group/navigation-menu-trigger relative inline-flex h-10 w-max cursor-pointer items-center justify-center gap-1 rounded-full px-1.5 text-[14.5px] font-medium whitespace-nowrap text-ink-900/80 outline-none xl:px-2 xl:text-[15px]",
  "transition-colors duration-150 hover:bg-mist-50 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40",
  "data-open:bg-mist-100 data-open:text-navy-900 data-active:font-semibold data-active:text-navy-900",
  "disabled:pointer-events-none disabled:opacity-50",
]);
