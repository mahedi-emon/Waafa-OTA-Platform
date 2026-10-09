"use client";

import * as React from "react";
import { cn } from "cn";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { PlusIcon } from "lucide-react";

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-mist-200 last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * Question row (Components board): navy 16 px label and a 28 px round toggle that turns from "+" on mist
 * to "×" on navy. The plus rotates 45° (transform only); the colour swap is instant.
 */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex min-h-14 flex-1 cursor-pointer items-center justify-between gap-4 py-3.5 text-left text-base font-semibold text-navy-900 focus-visible:rounded-sm disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-mist-100 text-navy-900 group-aria-expanded/accordion-trigger:bg-navy-900 group-aria-expanded/accordion-trigger:text-white"
        >
          <PlusIcon className="size-4 transition-transform duration-200 ease-out group-aria-expanded/accordion-trigger:rotate-45" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * Answer panel. No height animation (MOTION.md: transform and opacity only): the panel opens at full height
 * and its text fades and rises 4 px; closing fades out before the panel collapses.
 */
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="text-[15px] leading-relaxed text-mist-700 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-0"
      {...props}
    >
      <div
        className={cn(
          "pb-4 [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-3",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
