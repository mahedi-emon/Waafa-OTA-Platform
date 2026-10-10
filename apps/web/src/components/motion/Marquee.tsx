import type { ReactNode } from "react";
import { cn } from "cn";

type MarqueeProps = {
  children: ReactNode;
  /** Accessible name for the row, e.g. "Airlines we book". */
  label: string;
  className?: string;
};

/**
 * Logo marquee (MOTION.md): the row glides left over 40 s and pauses on hover or keyboard focus.
 * Pure CSS (no JavaScript). The duplicate track is hidden from assistive technology. Under reduced motion
 * the row stops and wraps onto as many lines as it needs (no hidden scroll area). One marquee per page at most.
 */
function Marquee({ children, label, className }: MarqueeProps) {
  const track =
    "flex shrink-0 items-center gap-10 pr-10 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:gap-x-3 motion-reduce:gap-y-3 motion-reduce:pr-0";

  return (
    <section
      aria-label={label}
      className={cn(
        "group/marquee relative overflow-hidden motion-reduce:overflow-visible",
        "[mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]",
        className,
      )}
    >
      <div className="flex w-max animate-marquee group-focus-within/marquee:[animation-play-state:paused] group-hover/marquee:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none">
        <div className={track}>{children}</div>
        <div className={cn(track, "motion-reduce:hidden")} aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </section>
  );
}

export { Marquee };
