"use client";

import * as React from "react";
import { cn } from "cn";

type SwitchProps = Omit<
  React.ComponentProps<"input">,
  "type" | "role" | "checked" | "defaultChecked" | "onChange" | "children"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

/**
 * 44 × 26 switch; the thumb slides by transform. Track colour swaps instantly. A native checkbox with the switch role
 * behind the shadcn API (issue 236), so public pages carry no Radix code for it; the thumb is a pseudo-element.
 */
function Switch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  ...props
}: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      data-slot="switch"
      data-state={checked === undefined ? undefined : checked ? "checked" : "unchecked"}
      {...(checked === undefined ? { defaultChecked } : { checked })}
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.target.checked);
      }}
      className={cn(
        "peer relative inline-flex h-[26px] w-11 shrink-0 cursor-pointer appearance-none items-center rounded-full bg-mist-300 outline-none checked:bg-primary",
        "before:pointer-events-none before:absolute before:top-[3px] before:left-[3px] before:size-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:duration-200 before:ease-out checked:before:translate-x-[18px]",
        "after:absolute after:-inset-x-2 after:-inset-y-[9px]",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export { Switch };
