"use client";

import * as React from "react";
import { cn } from "cn";

/*
 * Native radio inputs behind the shadcn RadioGroup API (issue 236): the browser gives arrow keys, one tab stop and
 * form submission, so public pages skip Radix's roving focus and collection code (about 8 KB gzip per page).
 */

type RadioGroupContextValue = {
  name: string;
  value: string | undefined;
  disabled: boolean;
  required: boolean;
  select: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = Omit<React.ComponentProps<"div">, "defaultValue" | "dir" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Kept for API parity; native radios move with every arrow key. */
  orientation?: "horizontal" | "vertical";
};

function RadioGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  required = false,
  orientation: _orientation,
  ...props
}: RadioGroupProps) {
  const fallbackName = React.useId();
  const [inner, setInner] = React.useState(defaultValue);
  const current = value ?? inner;
  const context = React.useMemo<RadioGroupContextValue>(
    () => ({
      name: name ?? fallbackName,
      value: current,
      disabled,
      required,
      select: (next) => {
        setInner(next);
        onValueChange?.(next);
      },
    }),
    [name, fallbackName, current, disabled, required, onValueChange],
  );

  return (
    <RadioGroupContext.Provider value={context}>
      <div
        role="radiogroup"
        data-slot="radio-group"
        aria-required={required || undefined}
        data-disabled={disabled ? "" : undefined}
        className={cn("grid w-full gap-2.5", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  );
}

type RadioGroupItemProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "checked" | "defaultChecked" | "name" | "children"
> & { value: string };

/** 20 px radio with a 44 px hit area; checked = electric ring with an electric dot. */
function RadioGroupItem({ className, value, disabled, onChange, ...props }: RadioGroupItemProps) {
  const group = React.useContext(RadioGroupContext);
  const checked = group?.value === value;
  const state = checked ? "checked" : "unchecked";

  return (
    <input
      type="radio"
      data-slot="radio-group-item"
      data-state={state}
      data-checked={checked ? "" : undefined}
      name={group?.name}
      value={value}
      checked={checked}
      required={group?.required}
      disabled={disabled ?? group?.disabled}
      onChange={(event) => {
        onChange?.(event);
        if (event.target.checked) group?.select(value);
      }}
      className={cn(
        "peer relative flex aspect-square size-5 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-full border-[1.5px] border-mist-400 bg-white outline-none",
        "after:absolute after:-inset-3",
        "checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3.5px_var(--color-white)]",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-danger-600",
        className,
      )}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupItem };
