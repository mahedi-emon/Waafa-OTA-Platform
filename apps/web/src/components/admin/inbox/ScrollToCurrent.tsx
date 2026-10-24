"use client";

import { useEffect } from "react";

/**
 * Brings the open item of a queue into view when the page opens (D0 R6): moving to the 20th lead must not leave it
 * below the fold of the list beside it. Instant, so reduced motion has nothing to stop.
 */
function ScrollToCurrent({ listId }: { listId: string }) {
  useEffect(() => {
    document
      .getElementById(listId)
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [listId]);
  return null;
}

export { ScrollToCurrent };
