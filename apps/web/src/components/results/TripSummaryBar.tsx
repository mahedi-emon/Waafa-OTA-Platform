"use client";

import { useState, type ReactNode } from "react";
import { PenLine, X } from "lucide-react";
import { TripSummaryMorph } from "@/components/motion/TripSummaryMorph";
import { Button } from "@/components/ui/button";

type TripSummaryBarProps = {
  /** "DAC → DXB", already formatted. */
  route: string;
  /** "Thu, 22 Oct · 1 traveller · Economy". */
  details: string;
  labels: { region: string; edit: string; close: string };
  /** A small picture of the trip between the summary and Edit (the flight route arc), from 640 px. */
  visual?: ReactNode;
  /** The search card, shown when the visitor edits the trip (Flights-edit). */
  children: ReactNode;
};

/**
 * Results summary bar: the trip the visitor searched, with Edit opening the full search card in place (the card
 * keeps the trip filled in). Sticky under the header on desktop.
 */
function TripSummaryBar({ route, details, labels, visual, children }: TripSummaryBarProps) {
  const [editing, setEditing] = useState(false);

  return (
    <section aria-label={labels.region} className="flex flex-col gap-3">
      <TripSummaryMorph>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-mist-200 bg-white px-4 py-3 shadow-xs md:px-5">
          <p className="min-w-0">
            <span className="block truncate font-display text-[18px] font-extrabold tracking-wide text-navy-900 md:text-[20px]">
              {route}
            </span>
            <span className="block truncate text-[13.5px] text-mist-600 tabular-nums">
              {details}
            </span>
          </p>
          {visual ? <div className="ml-auto hidden sm:block">{visual}</div> : null}
          <Button
            type="button"
            variant={editing ? "ghost" : "secondary"}
            size="sm"
            aria-expanded={editing}
            onClick={() => setEditing((open) => !open)}
            className="shrink-0"
          >
            {editing ? <X aria-hidden="true" /> : <PenLine aria-hidden="true" />}
            {editing ? labels.close : labels.edit}
          </Button>
        </div>
      </TripSummaryMorph>
      {editing ? <div className="motion-safe:animate-rise">{children}</div> : null}
    </section>
  );
}

export { TripSummaryBar };
