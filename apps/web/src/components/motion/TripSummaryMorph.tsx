import { ViewTransition, type ReactNode } from "react";

/**
 * Search → results (MOTION.md "Search → results", issue 256): the Home search card and the results summary bar share
 * one view-transition name, so on submit the card glides and shrinks into the bar. The results page's loading preview
 * carries the name too, so the pair forms even while results stream. `default="none"` keeps it still on every other
 * transition; reduced motion makes it instant (globals.css). Only one element per page may carry it.
 */
function TripSummaryMorph({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name="trip-summary" share="trip-morph" default="none">
      {children}
    </ViewTransition>
  );
}

export { TripSummaryMorph };
