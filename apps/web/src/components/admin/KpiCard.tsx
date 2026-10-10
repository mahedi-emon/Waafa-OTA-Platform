import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Link } from "@/i18n/navigation";

const kpiVariants = cva(
  "flex min-h-[112px] flex-col justify-between gap-3 rounded-2xl border bg-white p-5 transition-colors duration-150",
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
};

/** One dashboard figure (AdminDash KPI row): label, big tabular number, optional link to the filtered list. */
function KpiCard({ label, value, href, tone }: KpiCardProps) {
  const body = (
    <>
      <p className="text-[13.5px] font-medium text-mist-600">{label}</p>
      <p
        className={cn(
          "font-display text-[30px] leading-none font-extrabold tabular-nums",
          tone === "alert" ? "text-danger-600" : "text-navy-900",
        )}
      >
        {value}
      </p>
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
