"use client";

import { ViewTransition, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { CARD_PHOTO } from "./cardPhoto";

type CardMorphProps = {
  /** Classes for the photo's box (it replaces the card's own photo wrapper). */
  className?: string;
  /** Off on detail pages, whose main photo already carries the shared name (related cards stay still). */
  enabled?: boolean;
  children: ReactNode;
};

/**
 * Card → detail (MOTION.md "Shared image card → detail", issue 256): when the visitor opens a card, its photo takes
 * the one shared name the detail page's main photo (and its loading preview) carries, so the photo grows into place.
 * Only the clicked card is named, so a page full of cards never repeats a name. `default="none"` keeps it still on
 * other transitions; reduced motion makes it instant (globals.css).
 */
function CardMorph({ className, enabled = true, children }: CardMorphProps) {
  const box = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const card = enabled ? box.current?.closest("article") : null;
    if (!card) return;
    const open = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      if (!(event.target instanceof Element) || !event.target.closest("a[data-nav]")) return;
      // Named before the navigation's transition starts (NavDriver listens on the document, after this).
      flushSync(() => setOpened(true));
    };
    card.addEventListener("click", open);
    return () => card.removeEventListener("click", open);
  }, [enabled]);

  if (!enabled) {
    return (
      <div ref={box} className={className}>
        {children}
      </div>
    );
  }
  return (
    <ViewTransition name={opened ? CARD_PHOTO : undefined} share="card-morph" default="none">
      <div ref={box} className={className}>
        {children}
      </div>
    </ViewTransition>
  );
}

export { CardMorph };
