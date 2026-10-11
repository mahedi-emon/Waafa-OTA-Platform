export type DesktopNavItem = { id: string; label: string; href?: string; panel?: "shop" | "more" };

/** The current section gets navy, semibold text and a 2 px electric bar under the label (Header board). */
export const CURRENT_TEXT = "has-[[data-current]]:font-semibold has-[[data-current]]:text-navy-900";
export const CURRENT_BAR = "inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-electric-600";
