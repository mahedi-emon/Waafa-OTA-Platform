import type { ReactNode } from "react";
import { cn } from "cn";

type HomeSectionShellProps = {
  /** id of the section's h2, which names the landmark. */
  labelledBy: string;
  tone?: "white" | "mist";
  className?: string;
  children: ReactNode;
};

/** One home section: 44 / 64 / 88 px rhythm (DESIGN.md §4), site container, CSS scroll reveal (no JS). */
function HomeSectionShell({
  labelledBy,
  tone = "white",
  className,
  children,
}: HomeSectionShellProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn("py-11 md:py-16 xl:py-[88px]", tone === "mist" && "bg-mist-50", className)}
    >
      <div className="site-container flex reveal-on-view flex-col gap-8 md:gap-10">{children}</div>
    </section>
  );
}

export { HomeSectionShell };
