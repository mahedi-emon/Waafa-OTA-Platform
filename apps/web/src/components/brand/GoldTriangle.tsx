import { cn } from "cn";

/**
 * The gold triangle from the A's in the wordmark (DESIGN.md signature 2): the only premium marker.
 * Decorative: the badge next to it carries the words ("Best seller", "Featured"). Never put text in gold.
 */
function GoldTriangle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-2 w-[9px] shrink-0 bg-linear-to-b from-gold-500 via-gold-600 via-62% to-gold-700 [clip-path:polygon(50%_0,100%_100%,0_100%)]",
        className,
      )}
    />
  );
}

export { GoldTriangle };
