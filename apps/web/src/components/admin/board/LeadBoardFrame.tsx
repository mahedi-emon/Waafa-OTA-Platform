import type { ReactNode } from "react";

type LeadBoardFrameProps = { label: string; children: ReactNode };

/**
 * The board's scroller: stages side by side, scrolling sideways (snapping one stage at a time on phones). Focusable so
 * keyboard users can scroll it; a dragged card scrolls it near the edges.
 */
function LeadBoardFrame({ label, children }: LeadBoardFrameProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="-mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:mx-0 md:snap-none md:px-0"
    >
      <ol className="flex items-start gap-3">{children}</ol>
    </div>
  );
}

export { LeadBoardFrame };
