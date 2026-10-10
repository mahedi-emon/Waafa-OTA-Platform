"use client";

import { useState } from "react";
import type { ItineraryDay } from "@waafa/shared";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type ItineraryDaysProps = {
  days: ItineraryDay[];
  headingId: string;
  title: string;
  labels: { day: string; expandAll: string; collapseAll: string };
};

/**
 * Day-by-day itinerary (PackageDetail): a timeline of days, the first one open; "Expand all" opens every day. The
 * day label uses `{n}` from the messages.
 */
function ItineraryDays({ days, headingId, title, labels }: ItineraryDaysProps) {
  const all = days.map((day) => String(day.day));
  const [open, setOpen] = useState<string[]>(all.slice(0, 1));
  const everything = open.length === all.length;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2
          id={headingId}
          className="font-display text-[22px] font-bold text-navy-900 md:text-[26px]"
        >
          {title}
        </h2>
        <Button type="button" variant="link" onClick={() => setOpen(everything ? [] : all)}>
          {everything ? labels.collapseAll : labels.expandAll}
        </Button>
      </div>
      <Accordion type="multiple" value={open} onValueChange={setOpen} className="relative">
        <span aria-hidden="true" className="absolute top-6 bottom-6 left-[19px] w-px bg-mist-200" />
        {days.map((day) => (
          <AccordionItem
            key={day.day}
            value={String(day.day)}
            className="relative border-b-0 pl-14"
          >
            <span
              aria-hidden="true"
              className="absolute top-3 left-0 grid size-10 place-items-center rounded-full bg-navy-900 font-display text-[14px] font-extrabold text-white tabular-nums"
            >
              {day.day}
            </span>
            <AccordionTrigger className="py-3">
              <span className="flex flex-col">
                <span className="text-[12px] font-bold tracking-[0.12em] text-brand-700 uppercase">
                  {labels.day.replace("{n}", String(day.day))}
                </span>
                <span className="text-[16px] font-bold text-navy-900">{day.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p>{day.body}</p>
              {day.tags.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {day.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-mist-100 px-2.5 py-1 text-[12.5px] font-medium text-ink-900"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

export { ItineraryDays };
