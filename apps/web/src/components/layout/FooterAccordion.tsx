"use client";

import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FooterAccordionProps = {
  columns: { id: string; title: string; links: ReactNode }[];
};

/** Phone footer link columns as accordions (FR-FTR-07): one open at a time, fades open (MOTION.md). */
function FooterAccordion({ columns }: FooterAccordionProps) {
  return (
    <Accordion type="single" collapsible className="border-y border-mist-200">
      {columns.map((column) => (
        <AccordionItem key={column.id} value={column.id} className="border-mist-200">
          <AccordionTrigger className="h-14 py-0 text-[13px] font-bold tracking-[0.1em] text-navy-900 uppercase hover:no-underline">
            {column.title}
          </AccordionTrigger>
          <AccordionContent className="pb-4">{column.links}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export { FooterAccordion };
