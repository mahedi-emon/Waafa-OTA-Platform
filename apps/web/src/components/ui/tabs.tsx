"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Tabs as TabsPrimitive } from "radix-ui";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
      {...props}
    />
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
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
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

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 data-open:animate-in data-open:fade-in-0", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
