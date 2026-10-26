import * as React from "react";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
  /** Classes for the wrapper (width, grid placement); `className` styles the select itself. */
  wrapperClassName?: string;
};

/**
 * The browser's own select, styled like our Select trigger (issue 236): the phone's native picker, keyboard and
 * screen-reader support, and no popover code in the page's first load. Public forms use this; the admin keeps the
 * Radix Select where it needs custom option rows.
 */
function NativeSelect({
  className,
  wrapperClassName,
  size = "default",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-full has-[select:disabled]:opacity-60",
        wrapperClassName,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          "h-12 w-full min-w-0 cursor-pointer appearance-none rounded-xl border border-input bg-white py-0 pr-10 pl-3.5 text-base font-medium text-mist-900 shadow-xs outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/13 disabled:cursor-not-allowed disabled:bg-mist-100 disabled:text-mist-500 aria-invalid:border-danger-600 aria-invalid:ring-4 aria-invalid:ring-danger-600/9 data-[size=sm]:h-11 data-[size=sm]:text-[15px]",
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-mist-500"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-white text-ink-900", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-white text-ink-900", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
