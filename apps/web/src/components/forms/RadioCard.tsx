import type { ReactNode } from "react";
import { cn } from "cn";
import { RadioGroupItem } from "@/components/ui/radio-group";

type RadioCardProps = {
  value: string;
  checked: boolean;
  disabled?: boolean;
  title: string;
  sub?: ReactNode;
  /** Right-hand side: a price or an icon. */
  aside?: ReactNode;
};

/** One choice in a radio group shown as a card (checkout delivery and payment). The whole card is the 44 px+ target. */
function RadioCard({ value, checked, disabled, title, sub, aside }: RadioCardProps) {
  return (
    <label
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-2xl border bg-white p-3.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/40",
        checked ? "border-electric-600 bg-electric-50" : "border-mist-200 hover:border-mist-300",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <RadioGroupItem value={value} disabled={disabled} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-navy-900">{title}</span>
        {sub ? <span className="mt-0.5 block text-[13px] text-mist-700">{sub}</span> : null}
      </span>
      {aside ? (
        <span className="shrink-0 font-semibold text-ink-900 tabular-nums">{aside}</span>
      ) : null}
    </label>
  );
}

export { RadioCard };
