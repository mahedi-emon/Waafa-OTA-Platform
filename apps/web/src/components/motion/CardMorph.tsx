import { ViewTransition, type ReactNode } from "react";

type CardMorphProps = {
  /** Unique on the page: the record's kind and slug ("package-bali-5-days"). Without it, nothing morphs. */
  name?: string;
  children: ReactNode;
};

/**
 * Card → detail (MOTION.md "Shared image card → detail", issue 256): a card's photo and the detail page's main photo
 * share a view-transition name, so opening a package or product grows the photo into the detail hero. Cards opt in
 * only on grids where a record appears once; `default="none"` keeps the photo still on unrelated transitions, and
 * reduced motion makes it instant (globals.css).
 */
function CardMorph({ name, children }: CardMorphProps) {
  if (!name) return <>{children}</>;
  return (
    <ViewTransition name={name} share="card-morph" default="none">
      {children}
    </ViewTransition>
  );
}

export { CardMorph };
