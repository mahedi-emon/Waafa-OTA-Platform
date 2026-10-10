import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import type { PageBlock } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { Link } from "@/i18n/navigation";

type InfoCardProps = {
  block: PageBlock;
  /** "card" is a bordered tile; "row" is a compact icon + text line (facts strips). */
  variant?: "card" | "row";
  headingLevel?: "h3" | "h4";
};

const TONES = {
  default: "border-mist-200 bg-white",
  warning: "border-warning-600/30 bg-warning-50",
  danger: "border-danger-600/25 bg-danger-25",
} as const;

const ICON_TONES = {
  default: "bg-electric-50 text-brand-700",
  warning: "bg-white text-warning-700",
  danger: "bg-white text-danger-600",
} as const;

/** One admin-edited page block (About services, baggage rules, EMI and payment steps): icon, title, text, link. */
function InfoCard({ block, variant = "card", headingLevel = "h3" }: InfoCardProps) {
  const Heading = headingLevel;
  if (variant === "row") {
    return (
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-electric-50 text-brand-700"
        >
          <MenuIcon name={block.icon} className="size-5" />
        </span>
        <span className="min-w-0">
          <Heading className="text-[15.5px] font-bold text-navy-900">{block.title}</Heading>
          <span className="block text-[13.5px] text-mist-700">{block.body}</span>
        </span>
      </div>
    );
  }
  return (
    <div className={cn("flex h-full flex-col gap-2.5 rounded-2xl border p-5", TONES[block.tone])}>
      <span
        aria-hidden="true"
        className={cn("grid size-10 place-items-center rounded-xl", ICON_TONES[block.tone])}
      >
        <MenuIcon name={block.icon} className="size-5" />
      </span>
      <Heading className="font-display text-[17px] font-bold text-navy-900">{block.title}</Heading>
      <p className="text-[14.5px] leading-relaxed text-mist-700">{block.body}</p>
      {block.link ? (
        block.link.external ? (
          <a
            href={block.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex min-h-11 items-center gap-1.5 text-[14.5px] font-semibold text-brand-700 hover:underline"
          >
            {block.link.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        ) : (
          <Link
            href={block.link.href}
            className="mt-auto inline-flex min-h-11 items-center gap-1.5 text-[14.5px] font-semibold text-brand-700 hover:underline"
          >
            {block.link.label}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )
      ) : null}
    </div>
  );
}

export { InfoCard };
