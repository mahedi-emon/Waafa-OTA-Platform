"use client";

import * as React from "react";
import { cn } from "cn";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";

/** 20 px checkbox with a 44 px hit area; checked = electric fill with a white tick. */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-mist-400 bg-white",
        "after:absolute after:-inset-3",
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        "disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger-600",
        className,
      )}
      {...props}
    >
      {/* Always mounted and hidden by state: Radix's Presence reads computed style on every toggle, which made
          selecting a 100-row page slow (D0 R5 INP). */}
      <CheckboxPrimitive.Indicator
        forceMount
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current data-[state=unchecked]:invisible [&>svg]:size-3.5"
      >
        <CheckIcon strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
