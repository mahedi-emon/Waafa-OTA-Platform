"use client";

import * as React from "react";
import { cn } from "cn";
import { Label as LabelPrimitive } from "radix-ui";

type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root> & {
  /** Adds a red asterisk (hidden from screen readers; the input carries `required`). */
  required?: boolean;
  /** Text after the label in muted grey, e.g. "(optional)". */
  hint?: React.ReactNode;
};

/** Field label (Components board): Inter 600 13.5 px, mist-700, above the field. */
function Label({ className, required, hint, children, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 type-label text-mist-700 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-danger-600">
          *
        </span>
      ) : null}
      {hint ? <span className="font-normal text-mist-500">{hint}</span> : null}
    </LabelPrimitive.Root>
  );
}

export { Label };
