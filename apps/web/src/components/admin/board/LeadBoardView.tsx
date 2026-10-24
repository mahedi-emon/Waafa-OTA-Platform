"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { LeadActionInput } from "@waafa/shared";
import {
  LEAD_BOARD_COLUMNS,
  leadStepForMove,
  type LeadBoardColumn,
} from "@waafa/shared/workflow/leads";
import { LeadStepDialog, type LeadDialogStep } from "@/components/admin/LeadStepDialog";
import { useRouter } from "@/i18n/navigation";
import { leadAction } from "@/lib/admin/leadActions";
import { LeadBoardCard, type BoardQuickStep, type CardDrag } from "./LeadBoardCard";
// dnd-kit is part of the board's own chunk (admin only) and renders from the first paint: loading it later swapped
// the cards and closed a Move to… menu someone had already opened.
import { LeadBoardDnd } from "./LeadBoardDnd";
import type { BoardCardData, BoardColumnData } from "./types";

/** Draws one card: with drag listeners once dragging is ready, or as the copy under the pointer. */
export type RenderCard = (
  card: BoardCardData,
  drag: CardDrag | null,
  overlay?: boolean,
) => ReactNode;

type LeadBoardViewProps = { columns: BoardColumnData[]; label: string };

/**
 * The lead board (ADMIN.md §5.5, D0 R6, after 21st.dev `diceui/kanban` and `rmahammad/kanban-card-movement`): a
 * move asks for exactly what the lead page asks (a quote's amount, what the lead waits for, the booked amount, an
 * outcome and reason, a reason to reopen) through the same dialog; a move the rules don't have is refused in words and
 * the card stays put. Drag with a mouse or a long press; Move to… on every card for keyboards and single pointers.
 */
function LeadBoardView({ columns, label }: LeadBoardViewProps) {
  const t = useTranslations("Admin.leadBoard");
  const ta = useTranslations("Admin.leadActions");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [asking, setAsking] = useState<{ card: BoardCardData; step: LeadDialogStep } | null>(null);
  // The card just moved: its new copy in the next stage takes the keyboard focus back.
  const [focusId, setFocusId] = useState<string | null>(null);
  const titles = Object.fromEntries(columns.map((column) => [column.id, column.title])) as Record<
    LeadBoardColumn,
    string
  >;

  /** Steps that need nothing more run at once: a reply, or "Customer replied". */
  const run = (card: BoardCardData, input: LeadActionInput) =>
    startTransition(async () => {
      const result = await leadAction(card.id, input);
      if (!result.ok) {
        toast.error(result.problem.detail ?? t("failed"));
        return;
      }
      toast.success(t("stepDone", { reference: card.reference, step: ta(`done.${input.type}`) }));
      setFocusId(card.id);
      router.refresh();
    });

  const move = (card: BoardCardData, to: LeadBoardColumn) => {
    setFocusId(null);
    const result = leadStepForMove(card.status, to);
    if (!result.ok) {
      if (result.reason !== "same") toast.error(t(`refused.${result.reason}`));
      return;
    }
    if (result.step === "customerReplied") run(card, { type: "customerReplied" });
    else setAsking({ card, step: result.step });
  };

  const quick = (card: BoardCardData, step: BoardQuickStep) => {
    setFocusId(null);
    if (step === "reply") run(card, { type: "contact", channel: "whatsapp" });
    else if (step === "customerReplied") run(card, { type: "customerReplied" });
    else setAsking({ card, step });
  };

  const movesFor = (card: BoardCardData) =>
    LEAD_BOARD_COLUMNS.flatMap((to) =>
      leadStepForMove(card.status, to).ok ? [{ to, title: titles[to] }] : [],
    );

  const renderCard: RenderCard = (card, drag, overlay = false) => (
    <LeadBoardCard
      key={card.id}
      card={card}
      moves={movesFor(card)}
      onMove={(to) => move(card, to)}
      onQuick={(step) => quick(card, step)}
      drag={drag}
      overlay={overlay}
      focusMove={!overlay && card.id === focusId}
    />
  );

  return (
    <>
      <LeadBoardDnd columns={columns} label={label} onDrop={move} renderCard={renderCard} />
      <LeadStepDialog
        leadId={asking?.card.id ?? ""}
        step={asking?.step ?? null}
        {...(asking ? { subject: asking.card.reference } : {})}
        onClose={() => setAsking(null)}
        onDone={() => setFocusId(asking?.card.id ?? null)}
      />
    </>
  );
}

export { LeadBoardView };
