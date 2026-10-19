import { CircleDot } from "lucide-react";
import type { OrderStatus } from "@waafa/shared";
import { ORDER_CHIPS, type ChipSpec } from "@/lib/admin/statusChips";
import { StatusChip } from "./StatusChip";

type OrderStatusChipProps = {
  /** An order status; anything unexpected shows as a neutral chip with its label. */
  status: OrderStatus | (string & {});
  label: string;
  reason?: string;
  size?: "sm" | "md";
};

const FALLBACK: ChipSpec = { tone: "neutral", icon: CircleDot };

/** Order status as a chip: icon + word + colour (ADMIN.md §8.4). */
function OrderStatusChip({ status, label, reason, size = "sm" }: OrderStatusChipProps) {
  const spec = (ORDER_CHIPS as Record<string, ChipSpec>)[status] ?? FALLBACK;
  return <StatusChip tone={spec.tone} icon={spec.icon} label={label} reason={reason} size={size} />;
}

export { OrderStatusChip };
