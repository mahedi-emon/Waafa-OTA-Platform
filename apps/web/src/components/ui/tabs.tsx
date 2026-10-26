"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/*
 * The shadcn Tabs API on plain buttons (issue 236): roving tab stop, arrow keys, Home and End, automatic activation
 * and the tab ↔ panel ids follow the WAI-ARIA tabs pattern, without Radix's collection and roving-focus code on
 * public pages. Triggers carry both `data-state` and `data-active`, so the active-tab styles below now apply.
 */

type Orientation = "horizontal" | "vertical";

type TabsContextValue = {
  baseId: string;
  value: string | undefined;
  orientation: Orientation;
  select: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(part: string) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error(`${part} must be inside <Tabs>`);
  return context;
}

const safe = (value: string) => value.replace(/[^\w-]/g, "-");

type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: Orientation;
};

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  ...props
}: TabsProps) {
  const baseId = React.useId();
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const context = React.useMemo<TabsContextValue>(
    () => ({
      baseId,
      value: current,
      orientation,
      select: (next) => {
        setInner(next);
        onValueChange?.(next);
      },
    }),
    [baseId, current, orientation, onValueChange],
  );

  return (
    <TabsContext.Provider value={context}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
        {...props}
      />
    </TabsContext.Provider>
  );
}

/**
 * `segmented`: mist track with a white pill on the active tab (trip type, sort, admin views).
 * `line`: underline tabs whose active marker is the 3 px ribbon (desktop search card, page sections).
 */
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        segmented:
          "h-11 max-w-full [scrollbar-width:none] gap-1 overflow-x-auto rounded-full bg-mist-100 p-1",
        line: "h-12 gap-6 border-b border-mist-200",
      },
    },
    defaultVariants: { variant: "segmented" },
  },
);

function TabsList({
  className,
  variant = "segmented",
  onKeyDown,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof tabsListVariants>) {
  const { orientation } = useTabs("TabsList");

  function move(event: React.KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    const previous = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    if (![next, previous, "Home", "End"].includes(event.key)) return;
    const tabs = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    ];
    const at = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (tabs.length === 0 || at === -1) return;
    event.preventDefault();
    const target =
      event.key === "Home"
        ? tabs[0]
        : event.key === "End"
          ? tabs[tabs.length - 1]
          : tabs[(at + (event.key === next ? 1 : -1) + tabs.length) % tabs.length];
    target?.focus();
    target?.click();
  }

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      data-slot="tabs-list"
      data-variant={variant}
      data-orientation={orientation}
      onKeyDown={move}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

type TabsTriggerProps = Omit<React.ComponentProps<"button">, "value"> & { value: string };

function TabsTrigger({ className, value, onClick, disabled, ...props }: TabsTriggerProps) {
  const tabs = useTabs("TabsTrigger");
  const active = tabs.value === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.baseId}-trigger-${safe(value)}`}
      aria-selected={active}
      aria-controls={`${tabs.baseId}-content-${safe(value)}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      data-state={active ? "active" : "inactive"}
      data-active={active ? "" : undefined}
      data-orientation={tabs.orientation}
      data-slot="tabs-trigger"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !active) tabs.select(value);
      }}
      className={cn(
        "relative inline-flex h-full cursor-pointer items-center justify-center gap-1.5 text-[14.5px] font-semibold whitespace-nowrap text-mist-600 hover:text-navy-900 disabled:pointer-events-none disabled:opacity-45",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // segmented
        "group-data-[variant=segmented]/tabs-list:flex-1 group-data-[variant=segmented]/tabs-list:rounded-full group-data-[variant=segmented]/tabs-list:px-3 sm:group-data-[variant=segmented]/tabs-list:px-4",
        "group-data-[variant=segmented]/tabs-list:data-active:bg-white group-data-[variant=segmented]/tabs-list:data-active:text-navy-900 group-data-[variant=segmented]/tabs-list:data-active:shadow-sm",
        // line: ribbon marker fades in under the active tab
        "group-data-[variant=line]/tabs-list:px-0.5 group-data-[variant=line]/tabs-list:data-active:text-navy-900",
        "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:bg-(image:--ribbon) after:opacity-0 after:transition-opacity after:duration-200",
        "group-data-[variant=segmented]/tabs-list:after:hidden group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

type TabsContentProps = Omit<React.ComponentProps<"div">, "value"> & {
  value: string;
  /** Keep the panel's content in the page while another tab is open (hidden). */
  forceMount?: boolean;
};

function TabsContent({
  className,
  value,
  forceMount = false,
  children,
  ...props
}: TabsContentProps) {
  const tabs = useTabs("TabsContent");
  const active = tabs.value === value;

  return (
    <div
      role="tabpanel"
      id={`${tabs.baseId}-content-${safe(value)}`}
      aria-labelledby={`${tabs.baseId}-trigger-${safe(value)}`}
      tabIndex={0}
      hidden={!active}
      data-state={active ? "active" : "inactive"}
      data-orientation={tabs.orientation}
      data-slot="tabs-content"
      className={cn("flex-1 data-open:animate-in data-open:fade-in-0", className)}
      {...props}
    >
      {active || forceMount ? children : null}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
