import { Star } from "lucide-react";
import { cn } from "cn";

type RatingStarsProps = { rating: number; label: string; className?: string };

/** A visitor's own star rating (approved feedback only), read out as one label. Never an average. */
function RatingStars({ rating, label, className }: RatingStarsProps) {
  return (
    <p className={cn("flex gap-0.5", className)} aria-label={label} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={
            i < rating ? "size-4 fill-electric-600 text-electric-600" : "size-4 text-mist-300"
          }
        />
      ))}
    </p>
  );
}

export { RatingStars };
