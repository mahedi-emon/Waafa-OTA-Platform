import { cn } from "cn";

/**
 * Skeleton (States board): mist-100 block with a light sweep that moves by transform only.
 * Give it the exact size of the content it stands in for, so nothing jumps when data arrives.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-mist-100",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-white/70 after:to-transparent motion-reduce:after:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
