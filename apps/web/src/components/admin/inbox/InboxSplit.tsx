"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useStoredValue } from "@/components/admin/useStoredValue";

const MIN = 320;
const MAX = 560;
const DEFAULT = 400;
const STEP = 16;

const clamp = (width: number) => Math.min(MAX, Math.max(MIN, Math.round(width)));

export type InboxSplitProps = {
  /** Remembers this inbox's list width on the device ("leads", "orders"). */
  id: string;
  /** The queue (InboxListPane), shown from 1280 px. */
  list: ReactNode;
  /** Names the resize handle for screen readers. */
  resizeLabel: string;
  children: ReactNode;
};

/**
 * The inbox layout (ADMIN.md §5.5, D232, D241): from 1280 px the queue stays on the left and the work item on the
 * right, each scrolling on its own; narrower screens show the work item alone, with Back to the list. One grid at
 * every width, so the work item never remounts (a half-typed reason survives turning a tablet). The handle between
 * them drags or takes the arrow keys (320 to 560 px) and the width is remembered on the device.
 */
function InboxSplit({ id, list, resizeLabel, children }: InboxSplitProps) {
  const [stored, setStored] = useStoredValue(`waafa.admin.inbox.${id}`, String(DEFAULT));
  const saved = clamp(Number(stored) || DEFAULT);
  const [dragging, setDragging] = useState<number | null>(null);
  const start = useRef<{ x: number; width: number } | null>(null);
  const width = dragging ?? saved;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, width };
    setDragging(width);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current) setDragging(clamp(start.current.width + event.clientX - start.current.x));
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    setStored(String(width));
    setDragging(null);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next =
      event.key === "ArrowLeft"
        ? width - STEP
        : event.key === "ArrowRight"
          ? width + STEP
          : event.key === "Home"
            ? MIN
            : event.key === "End"
              ? MAX
              : null;
    if (next === null) return;
    event.preventDefault();
    setStored(String(clamp(next)));
  };

  return (
    <div
      className="xl:grid xl:h-[calc(100dvh-8rem)] xl:grid-cols-[var(--inbox-list)_auto_minmax(0,1fr)]"
      style={{ "--inbox-list": `${width}px` } as CSSProperties}
    >
      <aside className="hidden min-h-0 xl:block">{list}</aside>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={resizeLabel}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="group hidden w-4 cursor-col-resize touch-none items-center justify-center outline-none select-none xl:flex"
      >
        <span
          aria-hidden="true"
          className="h-12 w-1 rounded-full bg-mist-200 transition-colors duration-150 group-hover:bg-electric-200 group-focus-visible:bg-electric-600 group-active:bg-electric-600"
        />
      </div>
      <div className="min-w-0 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain xl:pr-1">
        {children}
      </div>
    </div>
  );
}

export { InboxSplit };
