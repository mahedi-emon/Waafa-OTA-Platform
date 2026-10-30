import { ViewTransition, type ReactNode } from "react";
import { CARD_PHOTO } from "./cardPhoto";

/**
 * The detail page's side of the card → detail morph (issue 256): the main photo, and the loading preview's photo box
 * so the pair forms even while the page streams. One per page.
 */
function DetailMorph({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name={CARD_PHOTO} share="card-morph" default="none">
      {children}
    </ViewTransition>
  );
}

export { DetailMorph };
