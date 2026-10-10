import { cn } from "cn";

type SampleBadgeProps = { label: string; title?: string; className?: string };

/** Marks Sample records (PRD: every fixture is labelled until the team replaces it in Admin). */
function SampleBadge({ label, title, className }: SampleBadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-6 items-center rounded-[7px] border border-dashed border-mist-300 bg-white px-2 text-[12px] font-semibold text-mist-600",
        className,
      )}
    >
      {label}
    </span>
  );
}

export { SampleBadge };
