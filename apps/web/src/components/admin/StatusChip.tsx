import { cva } from "class-variance-authority";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ChipTone } from "@/lib/admin/statusChips";

const chipVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border leading-none font-semibold whitespace-nowrap transition-colors duration-150 [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "border-brand-700/20 bg-electric-50 text-brand-700",
        progress: "border-sky-700/20 bg-sky-50 text-sky-700",
        success: "border-success-700/20 bg-success-50 text-success-700",
        warning: "border-warning-800/20 bg-warning-50 text-warning-800",
        danger: "border-danger-700/20 bg-danger-50 text-danger-700",
        neutral: "border-mist-700/15 bg-mist-100 text-mist-700",
      },
      size: {
        sm: "h-6 px-2 text-[12px] [&>svg]:size-3",
        md: "h-7 px-2.5 text-[12.5px] [&>svg]:size-3.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

type StatusChipProps = {
  tone: ChipTone;
  icon: LucideIcon;
  label: string;
  /** Why it has this status ("Live on the site since 12 Oct 2026"): read by screen readers, shown on hover. */
  reason?: string;
  /** Detail pages make the chip focusable so keyboard users can open the reason; tables keep it out of the tab order. */
  focusable?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** A status as icon + word + colour, with the reason a tooltip away (ADMIN.md §8, D185). */
function StatusChip({
  tone,
  icon: Icon,
  label,
  reason,
  focusable = false,
  size,
  className,
}: StatusChipProps) {
  const chip = (
    <span
      className={cn(
        chipVariants({ tone, size }),
        focusable &&
          "cursor-help focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
      tabIndex={focusable && reason ? 0 : undefined}
    >
      <Icon aria-hidden="true" />
      {label}
      {reason ? <span className="sr-only">: {reason}</span> : null}
    </span>
  );
  if (!reason) return chip;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent className="max-w-64 text-[13px] leading-snug" aria-hidden="true">
        {reason}
      </TooltipContent>
    </Tooltip>
  );
}

export { StatusChip };
