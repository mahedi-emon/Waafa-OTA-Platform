import type { ReactNode } from "react";
import { cn } from "cn";
import { RibbonLine } from "@/components/brand/RibbonLine";

type SystemStateProps = {
  /** Large label above the title, e.g. "404" or "Maintenance". */
  code: string;
  title: string;
  lead: string;
  /** Buttons and links that get the visitor moving again. */
  actions?: ReactNode;
  /** Extra content under the actions, e.g. quick links or the error ID. */
  children?: ReactNode;
  /** "alert" for errors (announced), "status" otherwise. */
  role?: "alert" | "status";
  className?: string;
};

/**
 * Full-width system state (Error, Error500, Maintenance, States boards): code, one h1, what happened and what to do
 * next. Used by the 404, the error boundary and the maintenance screen, on the server and in the client boundary.
 */
function SystemState({ code, title, lead, actions, children, role, className }: SystemStateProps) {
  return (
    <section
      role={role}
      aria-labelledby="system-state-title"
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col items-start gap-4 py-10 md:py-16",
        className,
      )}
    >
      <RibbonLine className="w-16" />
      <p className="font-display text-[15px] font-extrabold tracking-[0.18em] text-brand-700 uppercase tabular-nums">
        {code}
      </p>
      <h1
        id="system-state-title"
        className="font-display text-[32px] leading-[1.06] font-extrabold tracking-tight text-balance text-navy-900 md:text-[46px]"
      >
        {title}
      </h1>
      <p className="max-w-[56ch] text-[16px] leading-relaxed text-mist-700">{lead}</p>
      {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
      {children}
    </section>
  );
}

export { SystemState };
