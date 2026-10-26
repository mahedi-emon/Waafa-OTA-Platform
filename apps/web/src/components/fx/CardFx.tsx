import type { ReactNode } from "react";
import { cn } from "cn";

type CardFxProps = {
  children: ReactNode;
  /** The card leans up to 4° towards the pointer (destinations, package grid). */
  tilt?: boolean;
  /** A soft electric glow follows the pointer (offers, visa and package cards). */
  spotlight?: boolean;
  /** Match the card's radius so the glow stays inside it, e.g. "rounded-2xl". */
  className?: string;
};

/**
 * Spotlight and 3D tilt for cards (HANDOFF effects: spotlight card and tilt card, rebuilt on our tokens). Mouse
 * pointers only, so touch devices see the plain card; the tilt stays off under reduced motion.
 *
 * Issue 236: a Server Component that only marks the card (`data-card-fx`); one listener for the whole page
 * (`CardFxDriver`) moves the glow and the tilt. Before, each card was a client component to hydrate (21 on the home
 * page) for an effect phones never use.
 */
function CardFx({ children, tilt = false, spotlight = true, className }: CardFxProps) {
  return (
    <div
      data-card-fx={tilt ? "tilt" : "spot"}
      className={cn(
        "group/fx relative h-full transition-transform duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
    >
      {children}
      {spotlight ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 spotlight-layer pointer-fine:group-hover/fx:opacity-100"
        />
      ) : null}
    </div>
  );
}

export { CardFx };
