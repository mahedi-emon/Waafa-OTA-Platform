import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { CopyButton } from "./CopyButton";

type ContactRowProps = {
  icon: ReactNode;
  /** Small caps label, e.g. "Call". */
  label: string;
  value: string;
  href: string;
  /** Opens in a new tab (WhatsApp, maps). */
  external?: boolean;
  /** Accessible name for the row link, e.g. "Call 01823-232241". */
  linkLabel: string;
  copy?: { value: string; label: string; copiedLabel: string; failedLabel: string };
};

/**
 * One contact method in the help panel and drawer: the whole row is the link (stretched), with an optional copy
 * button above it (Home-help board). 56 px tall, so every target is at least 44 px.
 */
function ContactRow({ icon, label, value, href, external, linkLabel, copy }: ContactRowProps) {
  return (
    <div className="group/row relative flex min-h-14 items-center gap-3 rounded-2xl border border-mist-200 bg-white py-2 pr-2 pl-3.5 transition-colors duration-150 hover:border-mist-300 hover:bg-mist-25">
      <span className="text-brand-700 [&_svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-mist-600 uppercase">
          {label}
        </span>
        <a
          href={href}
          aria-label={linkLabel}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="truncate text-[15.5px] font-semibold text-navy-900 tabular-nums outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/40"
        >
          {value}
        </a>
      </span>
      {copy ? <CopyButton {...copy} /> : null}
      <ArrowUpRight
        aria-hidden="true"
        className="mr-2 size-[18px] shrink-0 text-mist-500 transition-transform duration-150 group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5"
      />
    </div>
  );
}

export { ContactRow };
