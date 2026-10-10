import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { Link } from "@/i18n/navigation";

type SectionHeadingProps = {
  id: string;
  title: string;
  kicker?: string;
  subtitle?: string;
  /** "All packages" style link on the right (below on phones). */
  action?: { href: string; label: string };
  /** Small chips beside the kicker, e.g. the Sample badge. */
  aside?: ReactNode;
  align?: "start" | "center";
  className?: string;
};

/** Section heading (DESIGN.md §3): optional kicker, one h2, a lead and one action. `id` labels the section. */
function SectionHeading({
  id,
  title,
  kicker,
  subtitle,
  action,
  aside,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("flex max-w-[62ch] flex-col gap-2", align === "center" && "items-center")}>
        {kicker || aside ? (
          <div className="flex flex-wrap items-center gap-2">
            {kicker ? <p className="type-label text-brand-700">{kicker}</p> : null}
            {aside}
          </div>
        ) : null}
        <h2 id={id} className="type-h2 text-navy-900">
          {title}
        </h2>
        {subtitle ? <p className="type-lead text-mist-600">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group/action inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full text-[15px] font-semibold text-brand-700 outline-none hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 md:self-auto"
        >
          {action.label}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-150 group-hover/action:translate-x-0.5"
          />
        </Link>
      ) : null}
    </div>
  );
}

export { SectionHeading };
