import { CircleDot } from "lucide-react";
import {
  FEEDBACK_CHIPS,
  LEAD_CHIPS,
  ORDER_CHIPS,
  OVERDUE_CHIP,
  PROOF_CHIPS,
  RECORD_CHIPS,
  USER_CHIPS,
  type ChipSpec,
} from "@/lib/admin/statusChips";
import type { ChipView } from "./types";

const SETS: Record<ChipView["family"], Record<string, ChipSpec>> = {
  record: RECORD_CHIPS,
  lead: LEAD_CHIPS,
  order: ORDER_CHIPS,
  proof: PROOF_CHIPS,
  feedback: FEEDBACK_CHIPS,
  user: USER_CHIPS,
  overdue: { overdue: OVERDUE_CHIP },
};

const FALLBACK: ChipSpec = { tone: "neutral", icon: CircleDot };

/** The tone and icon of a chip the server named. */
export function chipSpecOf(chip: ChipView): ChipSpec {
  return SETS[chip.family]?.[chip.name] ?? FALLBACK;
}
