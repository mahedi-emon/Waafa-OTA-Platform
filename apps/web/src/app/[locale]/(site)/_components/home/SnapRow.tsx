import { Children, type ReactNode } from "react";
import { cn } from "cn";

type SnapRowProps = {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  /** For rows without links inside: makes the scroll area itself reachable by keyboard, named by this label. */
  scrollLabel?: string;
};

/**
 * Cards in a CSS scroll-snap row on phones and tablets (no JS), a grid from 1024 px (pass `lg:grid-cols-*`).
 * The row bleeds to the screen edges so the next card peeks in.
 */
function SnapRow({ children, className, itemClassName, scrollLabel }: SnapRowProps) {
  return (
    <ul
      tabIndex={scrollLabel ? 0 : undefined}
      aria-label={scrollLabel}
      className={cn(
        "outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 md:-mx-7 md:scroll-px-7 md:px-7",
        "lg:mx-0 lg:grid lg:snap-none lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0",
        className,
      )}
    >
      {Children.map(children, (child) => (
        <li
          className={cn(
            "w-[82%] max-w-[360px] shrink-0 snap-start sm:w-[46%] lg:w-auto lg:max-w-none",
            itemClassName,
          )}
        >
          {child}
        </li>
      ))}
    </ul>
  );
}

export { SnapRow };
