"use client";

import { useEffect, useRef, type HTMLAttributes, type Ref } from "react";
import { FileText, MessageCircleReply, MoveRight, WalletCards } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import type { LeadBoardColumn } from "@waafa/shared/workflow/leads";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import type { BoardCardData } from "./types";

/** The one step each stage offers on the card, the same the lead page starts with (D0 R4, R6). */
export type BoardQuickStep = "reply" | "quote" | "askPayment" | "customerReplied";

export const QUICK: Partial<Record<BoardCardData["status"], BoardQuickStep>> = {
  new: "reply",
  "in-progress": "quote",
  quoted: "askPayment",
  pending: "customerReplied",
};

const ICONS = { quote: FileText, askPayment: WalletCards, customerReplied: MessageCircleReply };

export type CardDrag = {
  setNodeRef: Ref<HTMLLIElement>;
  /** Pointer and touch listeners only: keyboards use Move to… (WCAG 2.5.7). */
  listeners: HTMLAttributes<HTMLLIElement> | undefined;
  isDragging: boolean;
};

type LeadBoardCardProps = {
  card: BoardCardData;
  /** Where the card may go, with the stage names. */
  moves: Array<{ to: LeadBoardColumn; title: string }>;
  onMove: (to: LeadBoardColumn) => void;
  onQuick: (step: BoardQuickStep) => void;
  drag?: CardDrag | null;
  /** The copy under the pointer while dragging. */
  overlay?: boolean;
  /** This card was just moved: its Move to… takes the keyboard focus again. */
  focusMove?: boolean;
};

/**
 * One lead on the board (D0 R6): who and what, its age and owner, the stage's next step in one press, and Move to…
 * for every stage it can reach. Dragging runs the same steps (LeadBoardView).
 */
function LeadBoardCard({
  card,
  moves,
  onMove,
  onQuick,
  drag,
  overlay = false,
  focusMove = false,
}: LeadBoardCardProps) {
  const t = useTranslations("Admin.leadBoard");
  const ta = useTranslations("Admin.leadActions");
  const quick = QUICK[card.status];
  const moveRef = useRef<HTMLButtonElement>(null);
  // After a move the card arrives in its new stage as a new element: keyboard focus follows it there.
  useEffect(() => {
    if (focusMove) moveRef.current?.focus();
  }, [focusMove]);

  return (
    <li
      ref={drag?.setNodeRef}
      {...drag?.listeners}
      className={cn(
        "flex min-w-0 list-none flex-col gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-mist-200",
        drag && "cursor-grab touch-manipulation active:cursor-grabbing",
        card.overdue && "ring-warning-800/40",
        drag?.isDragging && "opacity-40",
        overlay && "rotate-1 cursor-grabbing shadow-lg ring-electric-600",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={card.href}
          prefetch={false}
          className="min-w-0 rounded-md font-semibold text-navy-900 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <span className="block truncate">{card.name}</span>
          <span className="block truncate text-[12.5px] font-normal text-mist-600">
            {card.reference}
          </span>
        </Link>
        <Badge variant="neutral" className="shrink-0">
          {card.module}
        </Badge>
      </div>
      <p className="line-clamp-2 text-[13px] text-ink-900">{card.summary}</p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-mist-600">
        <span className="tabular-nums">{card.age}</span>
        <span aria-hidden="true">·</span>
        <span>{card.assignee ?? t("unassigned")}</span>
        {card.overdue ? <Badge variant="warning">{t("overdue")}</Badge> : null}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {quick === "reply" ? (
          <Button asChild variant="whatsapp" size="sm">
            <a
              href={card.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onQuick("reply")}
            >
              <WhatsAppIcon className="size-4" />
              {ta("contact.whatsapp")}
            </a>
          </Button>
        ) : quick ? (
          (() => {
            const Icon = ICONS[quick];
            return (
              <Button type="button" variant="secondary" size="sm" onClick={() => onQuick(quick)}>
                <Icon aria-hidden="true" className="size-4" />
                {ta(`steps.${quick}`)}
              </Button>
            );
          })()
        ) : (
          <span />
        )}
        {moves.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* The visible words start the name (WCAG 2.5.3); the reference tells cards apart. */}
              <Button ref={moveRef} type="button" variant="ghost" size="sm">
                <MoveRight aria-hidden="true" className="size-4" />
                {t("moveMenu")}
                <span className="sr-only"> {card.reference}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {t("moveMenuFor", { reference: card.reference })}
              </DropdownMenuLabel>
              {moves.map((move) => (
                <DropdownMenuItem key={move.to} onSelect={() => onMove(move.to)}>
                  {move.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  );
}

export { LeadBoardCard };
