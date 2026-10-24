import type { LeadStatus } from "@waafa/shared";
import type { LeadBoardColumn } from "@waafa/shared/workflow/leads";

/** One lead on the board, already in words (D0 R6). */
export type BoardCardData = {
  id: string;
  href: string;
  reference: string;
  name: string;
  summary: string;
  /** The service in words. */
  module: string;
  status: LeadStatus;
  assignee: string | null;
  /** "12 min", "3 h". */
  age: string;
  overdue: boolean;
  phone: string;
  /** wa.me link with the greeting written. */
  whatsappHref: string;
};

export type BoardColumnData = {
  id: LeadBoardColumn;
  title: string;
  total: number;
  cards: BoardCardData[];
  /** The rest of the column in the list, when it holds more than the board shows. */
  moreHref?: string;
};

/** How a column looks while a card is dragged over the board. */
export type ColumnState = "idle" | "allowed" | "refused" | "over";
