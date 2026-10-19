"use client";

import { lazy, Suspense, type ReactNode } from "react";
import { useHydrated } from "@/hooks/use-hydrated";

// dnd-kit loads only after the editor is interactive, and only on screens with a list to order.
const SortableDnd = lazy(() =>
  import("./SortableDnd").then((module) => ({ default: module.SortableDnd })),
);

export type SortableListProps = {
  /** One stable key per item (useStableKeys). */
  keys: string[];
  onMove: (from: number, to: number) => void;
  /** Words for announcements: "Day 2". */
  nameOf: (index: number) => string;
  /** No reordering (fixed lists). */
  disabled?: boolean;
  className?: string;
  /** Draws one item; `handle` is the drag handle once dragging is ready, null before (and when disabled). */
  renderItem: (index: number, handle: ReactNode) => ReactNode;
};

/** An ordered list that can be dragged into a new order; Move up and Move down in each item work without it. */
function SortableList(props: SortableListProps) {
  const hydrated = useHydrated();
  const plain = (
    <ol className={props.className}>
      {props.keys.map((key, index) => (
        <li key={key} className="min-w-0">
          {props.renderItem(index, null)}
        </li>
      ))}
    </ol>
  );
  if (!hydrated || props.disabled || props.keys.length < 2) return plain;
  return (
    <Suspense fallback={plain}>
      <SortableDnd {...props} />
    </Suspense>
  );
}

export { SortableList };
