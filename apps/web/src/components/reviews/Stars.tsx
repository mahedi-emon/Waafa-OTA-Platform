import { Star } from "@/components/icons/server/Star";
import { cn } from "cn";

type StarsProps = {
  /** 1 to 5, may be a decimal average (4.3 fills four stars). */
  rating: number;
  /** Words for screen readers, e.g. "4.3 out of 5". */
  label: string;
  className?: string;
};

/** Five stars filled up to the rating (issue 245); the stars are decoration, the label says the number. */
function Stars({ rating, label, className }: StarsProps) {
  const filled = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={cn(
            "size-4",
            value <= filled ? "fill-warning-700 text-warning-700" : "fill-none text-mist-300",
          )}
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export { Stars };
