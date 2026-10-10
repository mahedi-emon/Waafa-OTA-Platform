import type { ReactNode } from "react";
import { cn } from "cn";

type AdminPanelProps = {
  title?: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /** No inner padding (tables run edge to edge). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

/** A white admin card with an optional heading row (dashboard blocks, detail sections, tables). */
function AdminPanel({ title, lead, action, flush = false, className, children }: AdminPanelProps) {
  return (
    <section className={cn("rounded-2xl border border-mist-200 bg-white", className)}>
      {title ? (
        <div
          className={cn("flex items-start justify-between gap-3 px-5 pt-5", flush ? "pb-3" : "")}
        >
          <div className="min-w-0">
            <h2 className="font-display text-[17px] font-bold text-navy-900">{title}</h2>
            {lead ? <p className="mt-0.5 text-[13.5px] text-mist-600">{lead}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export { AdminPanel };
