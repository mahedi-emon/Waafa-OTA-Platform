"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { DrawCheck } from "@/components/motion/DrawCheck";
import { CopyButton } from "@/components/layout/CopyButton";
import { Confetti } from "./Confetti";

type LeadSuccessProps = {
  title: string;
  lead: string;
  reference: string;
  labels: { reference: string; copy: string; copied: string; copyFailed: string };
  steps: Array<{ title: string; body: ReactNode }>;
  actions: ReactNode;
  footnote?: string;
};

/**
 * Success as a boarding pass (MOTION.md signature moment): the pass slides out of a slot with the reference, a
 * self-drawing check and light confetti; reduced motion shows the end state. Focus moves to the title so screen
 * readers announce the result.
 */
function LeadSuccess({
  title,
  lead,
  reference,
  labels,
  steps,
  actions,
  footnote,
}: LeadSuccessProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="relative">
      <Confetti />
      <div
        className="mx-auto h-2 w-[86%] rounded-full bg-navy-900/90 shadow-inner"
        aria-hidden="true"
      />
      <article className="relative -mt-1 overflow-hidden rounded-[20px] border border-mist-200 bg-white shadow-lg motion-safe:[animation:pass-out_520ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="flex flex-col items-center gap-3 px-5 pt-7 pb-5 text-center md:px-8">
          <DrawCheck size={64} />
          <h2 ref={heading} tabIndex={-1} className="type-h2 text-navy-900 outline-none">
            {title}
          </h2>
          <p className="max-w-[46ch] text-[15px] leading-relaxed text-mist-700">{lead}</p>
        </div>
        {/* Tear line with notches, then the reference stub. */}
        <div className="relative border-t border-dashed border-mist-300 bg-mist-25 px-5 py-4 md:px-8">
          <span
            aria-hidden="true"
            className="absolute top-[-9px] -left-[9px] size-[18px] rounded-full border border-mist-200 bg-white"
          />
          <span
            aria-hidden="true"
            className="absolute top-[-9px] -right-[9px] size-[18px] rounded-full border border-mist-200 bg-white"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              <span className="block text-[12.5px] text-mist-600">{labels.reference}</span>
              <span className="font-display text-[24px] font-extrabold tracking-wide text-navy-900 tabular-nums">
                {reference}
              </span>
            </p>
            <CopyButton
              value={reference}
              label={labels.copy}
              copiedLabel={labels.copied}
              failedLabel={labels.copyFailed}
            />
          </div>
        </div>
        <ol className="flex flex-col gap-4 px-5 py-5 md:px-8">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-electric-50 font-display text-[13px] font-bold text-brand-700">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-navy-900">{step.title}</span>
                <span className="block text-[14px] leading-relaxed text-mist-600">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 border-t border-mist-200 px-5 py-4 sm:flex-row sm:flex-wrap md:px-8">
          {actions}
        </div>
        {footnote ? (
          <p className="px-5 pb-5 text-[13px] text-mist-600 md:px-8">{footnote}</p>
        ) : null}
      </article>
    </div>
  );
}

export { LeadSuccess };
