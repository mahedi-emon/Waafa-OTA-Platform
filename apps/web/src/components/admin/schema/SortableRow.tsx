"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

type SortableRowProps = {
  id: string;
  label: string;
  /** Reduced motion: items jump into place instead of sliding. */
  reduce: boolean;
  children: (handle: ReactNode) => ReactNode;
};

/** One draggable item of SortableDnd, with its grip handle. */
function SortableRow({ id, label, reduce, children }: SortableRowProps) {
  const t = useTranslations("Admin.editor.widgets");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, transition: reduce ? null : { duration: 160, easing: "ease-out" } });
  // Only transform and the drop transition change while dragging (dnd-kit sets them per frame).
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    ...(transition ? { transition } : {}),
  };
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${t("drag")}: ${label}`}
      className="relative flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-mist-500 after:absolute after:-inset-1 hover:bg-mist-100 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none active:cursor-grabbing"
    >
      <GripVertical aria-hidden="true" className="size-4" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn("min-w-0", isDragging && "relative z-10 opacity-90 shadow-lg")}
    >
      {children(handle)}
    </li>
  );
}

export { SortableRow };
