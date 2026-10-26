"use client";

import * as React from "react";
import { cn } from "cn";

type CheckboxProps = Omit<
  React.ComponentProps<"input">,
  "type" | "checked" | "defaultChecked" | "onChange" | "children"
> & {
  checked?: boolean | "indeterminate";
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

/**
 * 20 px checkbox with a 44 px hit area; checked = electric fill with a white tick. A native input behind the shadcn
 * API (issue 236): no Radix code on public pages, and the tick is a CSS mask (`checkbox-tick` in globals.css).
 */
function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  ref,
  ...props
}: CheckboxProps) {
  const inner = React.useRef<HTMLInputElement | null>(null);
  const indeterminate = checked === "indeterminate";

  React.useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      inner.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <input
      ref={setRef}
      type="checkbox"
      data-slot="checkbox"
      data-state={
        checked === undefined
          ? undefined
          : indeterminate
            ? "indeterminate"
            : checked
              ? "checked"
              : "unchecked"
      }
      {...(checked === undefined ? { defaultChecked } : { checked: checked === true })}
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.target.checked);
      }}
      className={cn(
        "peer checkbox-tick relative flex size-5 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-[6px] border-[1.5px] border-mist-400 bg-white text-primary-foreground outline-none",
        "after:absolute after:-inset-3",
        "checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger-600",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
