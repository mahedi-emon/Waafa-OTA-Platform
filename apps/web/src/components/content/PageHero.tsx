import type { ReactNode } from "react";
import { cn } from "cn";

type PageHeroProps = {
  /** id of the h1, so the page's main region can be named by it. */
  id?: string;
  kicker?: string;
  title: string;
  lead?: string;
  /** Chips beside the kicker, e.g. the Sample badge. */
  aside?: ReactNode;
  /** Buttons under the lead. */
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** Information page heading (About, Contact, FAQs, Blog…): kicker, one h1, a lead line and optional actions. */
function PageHero({ id, kicker, title, lead, aside, actions, className, children }: PageHeroProps) {
  return (
    <header className={cn("flex max-w-3xl flex-col gap-3", className)}>
      {kicker || aside ? (
        <div className="flex flex-wrap items-center gap-2">
          {kicker ? (
            <p className="text-[13px] font-bold tracking-[0.14em] text-brand-700 uppercase">
              {kicker}
            </p>
          ) : null}
          {aside}
        </div>
      ) : null}
      <h1
        id={id}
        className="font-display text-[32px] leading-[1.06] font-extrabold tracking-tight text-balance text-navy-900 md:text-[46px]"
      >
        {title}
      </h1>
      {lead ? (
        <p className="max-w-[62ch] text-[16px] leading-relaxed text-mist-700">{lead}</p>
      ) : null}
      {actions ? <div className="flex flex-wrap gap-3 pt-1">{actions}</div> : null}
      {children}
    </header>
  );
}

export { PageHero };
