"use client";

import * as React from "react";
import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";

/** 44 × 26 switch; the thumb slides by transform. Track colour swaps instantly. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-[26px] w-11 shrink-0 cursor-pointer items-center rounded-full p-[3px]",
        "after:absolute after:-inset-2",
        "data-checked:bg-primary data-unchecked:bg-mist-300",
        "data-disabled:cursor-not-allowed data-disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-checked:translate-x-[18px] data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
