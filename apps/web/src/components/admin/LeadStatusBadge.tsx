import type { LeadStatus } from "@waafa/shared";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<LeadStatus, "brand" | "warning" | "success" | "neutral" | "danger"> = {
  new: "brand",
  pending: "warning",
  "in-progress": "brand",
  quoted: "warning",
  booked: "success",
  cancelled: "neutral",
  lost: "neutral",
  spam: "danger",
};

type LeadStatusBadgeProps = { status: LeadStatus; label: string };

/** Lead status as a badge: colour plus the word, never colour alone. */
function LeadStatusBadge({ status, label }: LeadStatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{label}</Badge>;
}

export { LeadStatusBadge };
