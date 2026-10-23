import { StatusChip } from "@/components/admin/StatusChip";
import { chipSpecOf } from "./chipSpec";
import type { ChipView } from "./types";

type RowChipsProps = { chips: ChipView[]; focusable?: boolean; size?: "sm" | "md" };

/** A row's status chips, each with its reason a tooltip away. */
function RowChips({ chips, focusable = false, size = "sm" }: RowChipsProps) {
  if (chips.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const spec = chipSpecOf(chip);
        return (
          <StatusChip
            key={`${chip.family}-${chip.name}`}
            size={size}
            tone={spec.tone}
            icon={spec.icon}
            label={chip.label}
            {...(chip.reason ? { reason: chip.reason } : {})}
            focusable={focusable}
          />
        );
      })}
    </span>
  );
}

export { RowChips };
