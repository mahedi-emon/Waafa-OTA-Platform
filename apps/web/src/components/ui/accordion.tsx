"use client";

import * as React from "react";
import { cn } from "cn";
import { PlusIcon } from "lucide-react";

/**
 * Accordion on native `<details>` (issue 91): no script measures the panels while the page hydrates, closed answers
 * stay in find-in-page, and "single" groups use the `name` attribute so opening one closes the others. Same API as
 * the shadcn accordion it replaces (type, collapsible, defaultValue, value, onValueChange).
 */

type AccordionState = {
  /** Shared `name` for single accordions: the browser keeps one item open. */
  name?: string;
  /** Open items when controlled. */
  value?: string[];
  defaults: string[];
  onToggle: (item: string, open: boolean) => void;
};

const AccordionContext = React.createContext<AccordionState>({
  defaults: [],
  onToggle: () => undefined,
});

type BaseProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange">;

type SingleProps = BaseProps & {
  type: "single";
  /** Kept for API compatibility: native single accordions can always close the open item. */
  collapsible?: boolean;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

type MultipleProps = BaseProps & {
  type: "multiple";
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
};

function toList(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : value ? [value] : [];
}

function Accordion(props: SingleProps | MultipleProps) {
  const { type, defaultValue, value, onValueChange, className, ...rest } = props;
  const domProps = { ...rest } as BaseProps & { collapsible?: boolean };
  delete domProps.collapsible;
  const groupId = React.useId();
  const controlled = toList(value);

  const state: AccordionState = {
    ...(type === "single" ? { name: `accordion-${groupId}` } : {}),
    ...(controlled ? { value: controlled } : {}),
    defaults: toList(defaultValue) ?? [],
    onToggle: (item, open) => {
      if (!onValueChange) return;
      const current = controlled ?? [];
      if (current.includes(item) === open) return;
      if (type === "single") {
        (onValueChange as (next: string) => void)(open ? item : "");
      } else {
        const next = open ? [...current, item] : current.filter((entry) => entry !== item);
        (onValueChange as (next: string[]) => void)(next);
      }
    },
  };

  return (
    <AccordionContext.Provider value={state}>
      <div data-slot="accordion" className={cn("flex w-full flex-col", className)} {...domProps} />
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = Omit<React.ComponentProps<"details">, "open" | "name"> & {
  value: string;
};

function AccordionItem({ value, className, onToggle, ...props }: AccordionItemProps) {
  const state = React.useContext(AccordionContext);
  const open = state.value ? state.value.includes(value) : state.defaults.includes(value);

  return (
    <details
      data-slot="accordion-item"
      name={state.name}
      open={open}
      onToggle={(event) => {
        onToggle?.(event);
        state.onToggle(value, event.currentTarget.open);
      }}
      className={cn("group/accordion-item border-b border-mist-200 last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * Question row (Components board): navy 16 px label and a 28 px round toggle that turns from "+" on mist
 * to "×" on navy. The plus rotates 45° (transform only); the colour swap is instant.
 */
function AccordionTrigger({ className, children, ...props }: React.ComponentProps<"summary">) {
  return (
    <summary
      data-slot="accordion-trigger"
      className={cn(
        "flex min-h-14 flex-1 cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-left text-base font-semibold text-navy-900 outline-none focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-mist-100 text-navy-900 group-open/accordion-item:bg-navy-900 group-open/accordion-item:text-white"
      >
        <PlusIcon className="size-4 transition-transform duration-200 ease-out group-open/accordion-item:rotate-45" />
      </span>
    </summary>
  );
}

/**
 * Answer panel. No height animation (MOTION.md: transform and opacity only): the panel opens at full height
 * and its text fades and rises 4 px.
 */
function AccordionContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="accordion-content"
      className="text-[15px] leading-relaxed text-mist-700 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1"
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
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
