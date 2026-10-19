import { CircleDot } from "lucide-react";
import type { LeadStatus } from "@waafa/shared";
import { LEAD_CHIPS, type ChipSpec } from "@/lib/admin/statusChips";
import { StatusChip } from "./StatusChip";

type LeadStatusBadgeProps = {
  /** A lead status; anything unexpected shows as a neutral chip with its label. */
  status: LeadStatus | (string & {});
  label: string;
  /** Why it has this status, read out and shown on hover (R4 fills it from the timeline). */
  reason?: string;
  size?: "sm" | "md";
};

const FALLBACK: ChipSpec = { tone: "neutral", icon: CircleDot };

/** Lead status as a chip: icon + word + colour, never colour alone (ADMIN.md §8.2). */
function LeadStatusBadge({ status, label, reason, size = "sm" }: LeadStatusBadgeProps) {
  const spec = (LEAD_CHIPS as Record<string, ChipSpec>)[status] ?? FALLBACK;
  return <StatusChip tone={spec.tone} icon={spec.icon} label={label} reason={reason} size={size} />;
}

export { LeadStatusBadge };
