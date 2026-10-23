"use client";

import { useId } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { usePrefersReducedMotion } from "@/components/motion/reducedMotion";
import type { SortableListProps } from "./SortableList";
import { SortableRow } from "./SortableRow";

/** The dnd-kit half of SortableList: pointer, touch and keyboard dragging with spoken positions. */
function SortableDnd({
  keys,
  onMove,
  nameOf,
  className,
  renderItem,
  layout = "list",
}: SortableListProps) {
  const t = useTranslations("Admin.editor.widgets");
  const id = useId();
  const reduce = usePrefersReducedMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const indexOf = (key: string | number) => keys.indexOf(String(key));
  const announce = (key: string | number, over: string | number | undefined) =>
    t("moved", {
      thing: nameOf(indexOf(key)),
      position: (over === undefined ? indexOf(key) : indexOf(over)) + 1,
      total: keys.length,
    });
  const announcements: Announcements = {
    onDragStart: ({ active }) => nameOf(indexOf(active.id)),
    onDragOver: ({ active, over }) => announce(active.id, over?.id),
    onDragEnd: ({ active, over }) => announce(active.id, over?.id),
    onDragCancel: ({ active }) => announce(active.id, active.id),
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = indexOf(active.id);
    const to = indexOf(over.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={
        layout === "grid"
          ? [restrictToParentElement]
          : [restrictToVerticalAxis, restrictToParentElement]
      }
      accessibility={{ announcements }}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={keys}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <ol className={className}>
          {keys.map((key, index) => (
            <SortableRow key={key} id={key} label={nameOf(index)} reduce={reduce}>
              {(handle) => renderItem(index, handle)}
            </SortableRow>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

export { SortableDnd };
