import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "cn";
import { Sparkline } from "./dashboard/Sparkline";
import { LocalLink as Link } from "@/components/nav/LocalLink";

const kpiVariants = cva(
  "flex h-full min-h-[112px] flex-col justify-between gap-3 rounded-2xl border bg-white p-4 transition-colors duration-150 sm:p-5",
  {
    variants: {
      tone: {
        neutral: "border-mist-200",
        alert: "border-danger-600/30 bg-danger-25",
        good: "border-mist-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

type KpiCardProps = VariantProps<typeof kpiVariants> & {
  label: string;
  value: ReactNode;
  href?: string;
  /** The last 14 days, drawn as a small line under the figure. */
  trend?: readonly number[];
  /** The change in words ("4 more than last week") and which way it went; "none" is a plain line without an arrow. */
  change?: { text: string; direction: "up" | "down" | "same" | "none" };
};

const CHANGE_ICONS = { up: TrendingUp, down: TrendingDown, same: Minus } as const;

/**
 * One dashboard figure (ADMIN.md §5.2): label, big tabular number, and when given a 14-day line and the change in
 * words; links to the list behind it.
 */
function KpiCard({ label, value, href, tone, trend, change }: KpiCardProps) {
  const ChangeIcon = change && change.direction !== "none" ? CHANGE_ICONS[change.direction] : null;
  const body = (
    <>
      <p className="text-[13.5px] font-medium text-mist-600">{label}</p>
      <div className="flex flex-col gap-2">
        <p
          className={cn(
            "font-display text-[24px] leading-none font-extrabold break-words tabular-nums sm:text-[30px]",
            tone === "alert" ? "text-danger-600" : "text-navy-900",
          )}
        >
          {value}
        </p>
        {trend ? <Sparkline values={trend} /> : null}
        {change ? (
          <p className="flex items-center gap-1.5 text-[13px] text-mist-600">
            {ChangeIcon ? (
              <ChangeIcon
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0",
                  change.direction === "up"
                    ? "text-success-600"
                    : change.direction === "down"
                      ? "text-danger-600"
                      : "text-mist-400",
                )}
              />
            ) : null}
            {change.text}
          </p>
        ) : null}
      </div>
    </>
  );
  if (!href) return <div className={kpiVariants({ tone })}>{body}</div>;
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        kpiVariants({ tone }),
        "hover:border-electric-200 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
      )}
    >
      {body}
    </Link>
  );
}

export { KpiCard };
