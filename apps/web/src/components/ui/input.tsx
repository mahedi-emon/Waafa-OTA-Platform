import * as React from "react";
import { cn } from "cn";

/**
 * Field styles shared by Input, Textarea, Select and the phone input (Components board):
 * 50 px, radius 12, 16 px text (no iOS zoom), electric border + 4 px halo on focus, danger on aria-invalid.
 */
const fieldControlClasses = [
  "w-full min-w-0 rounded-md border border-input bg-white px-3.5 text-base font-medium text-mist-900 shadow-xs outline-none",
  "placeholder:font-normal placeholder:text-mist-500",
  "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/13",
  "disabled:cursor-not-allowed disabled:bg-mist-100 disabled:text-mist-500 disabled:shadow-none",
  "aria-invalid:border-danger-600 aria-invalid:bg-danger-25 aria-invalid:ring-4 aria-invalid:ring-danger-600/9",
];

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldControlClasses,
        "h-[50px] file:mr-3 file:inline-flex file:h-8 file:rounded-sm file:border-0 file:bg-mist-100 file:px-3 file:text-sm file:font-semibold file:text-navy-900",
        className,
      )}
      {...props}
    />
  );
}

export { Input, fieldControlClasses };
