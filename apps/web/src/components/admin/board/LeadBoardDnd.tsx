"use client";

import { useId, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { boardColumnOf, leadStepForMove, type LeadBoardColumn } from "@waafa/shared/workflow/leads";
import { usePrefersReducedMotion } from "@/components/motion/reducedMotion";
import { LeadBoardColumn as Column } from "./LeadBoardColumn";
import { LeadBoardFrame } from "./LeadBoardFrame";
import type { RenderCard } from "./LeadBoardView";
import type { BoardCardData, BoardColumnData, ColumnState } from "./types";

type LeadBoardDndProps = {
  columns: BoardColumnData[];
  label: string;
  onDrop: (card: BoardCardData, to: LeadBoardColumn) => void;
  renderCard: RenderCard;
};

function DroppableColumn({
  column,
  state,
  children,
}: {
  column: BoardColumnData;
  state: ColumnState;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <Column
      column={column}
      state={isOver && state === "allowed" ? "over" : state}
      innerRef={setNodeRef}
    >
      {children}
    </Column>
  );
}

function DraggableCard({ card, renderCard }: { card: BoardCardData; renderCard: RenderCard }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: card.id });
  return renderCard(card, { setNodeRef, listeners, isDragging });
}

/**
 * The dnd-kit half of the board: mouse and long-press dragging between stages, stages that can't take the card
 * fading while it moves, a copy under the pointer, and every pick-up and drop spoken in plain words.
 */
function LeadBoardDnd({ columns, label, onDrop, renderCard }: LeadBoardDndProps) {
  const t = useTranslations("Admin.leadBoard");
  const id = useId();
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState<BoardCardData | null>(null);
  // Mouse and touch apart: a pointer sensor would take every touch and lose it to scrolling, so the long press would
  // never start a drag on a phone or tablet.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );
  const cards = new Map(columns.flatMap((column) => column.cards.map((card) => [card.id, card])));
  const titles = new Map(columns.map((column) => [column.id as string, column.title]));
  const reference = (cardId: string | number) => cards.get(String(cardId))?.reference ?? "";
  const stateOf = (column: LeadBoardColumn): ColumnState => {
    if (!active || boardColumnOf(active.status) === column) return "idle";
    return leadStepForMove(active.status, column).ok ? "allowed" : "refused";
  };
  const announcements: Announcements = {
    onDragStart: ({ active: card }) => t("announce.picked", { reference: reference(card.id) }),
    onDragOver: ({ active: card, over }) =>
      over
        ? t("announce.over", {
            reference: reference(card.id),
            stage: titles.get(String(over.id)) ?? "",
          })
        : t("announce.outside", { reference: reference(card.id) }),
    onDragEnd: ({ active: card, over }) =>
      over
        ? t("announce.dropped", {
            reference: reference(card.id),
            stage: titles.get(String(over.id)) ?? "",
          })
        : t("announce.cancelled", { reference: reference(card.id) }),
    onDragCancel: ({ active: card }) => t("announce.cancelled", { reference: reference(card.id) }),
  };

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={pointerWithin}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t("dragInstructions") },
      }}
      onDragStart={({ active: card }) => setActive(cards.get(String(card.id)) ?? null)}
      onDragCancel={() => setActive(null)}
      onDragEnd={({ active: card, over }) => {
        setActive(null);
        const dragged = cards.get(String(card.id));
        if (dragged && over) onDrop(dragged, over.id as LeadBoardColumn);
      }}
    >
      <LeadBoardFrame label={label}>
        {columns.map((column) => (
          <DroppableColumn key={column.id} column={column} state={stateOf(column.id)}>
            {column.cards.map((card) => (
              <DraggableCard key={card.id} card={card} renderCard={renderCard} />
            ))}
          </DroppableColumn>
        ))}
      </LeadBoardFrame>
      <DragOverlay dropAnimation={reduce ? null : undefined}>
        {active ? <ul className="w-[min(16rem,78vw)]">{renderCard(active, null, true)}</ul> : null}
      </DragOverlay>
    </DndContext>
  );
}

export { LeadBoardDnd };
