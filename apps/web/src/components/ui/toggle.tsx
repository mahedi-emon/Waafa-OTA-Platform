"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Toggle as TogglePrimitive } from "radix-ui";

/**
 * `chip`: filter chips (32 px pills); pressed chips turn navy (Components board, Chips).
 * `segment`: an option inside a segmented ToggleGroup; the pressed one gets the white pill.
 */
const toggleVariants = cva(
  "group/toggle inline-flex cursor-pointer items-center justify-center gap-1.5 font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        chip: "rounded-full border border-mist-300 bg-white text-navy-900 hover:border-mist-400 data-[state=on]:border-navy-900 data-[state=on]:bg-navy-900 data-[state=on]:text-white",
        segment:
          "rounded-full text-mist-600 hover:text-navy-900 data-[state=on]:bg-white data-[state=on]:text-navy-900 data-[state=on]:shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "chip", size: "sm" },
  },
);

function Toggle({
  className,
  variant = "chip",
  size = "sm",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
