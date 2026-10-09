import type { ComponentProps } from "react";
import { cn } from "cn";
import { Slot } from "radix-ui";

/** Press feedback for tappable cards and tiles: scales to 0.98 while pressed (transform only, 150 ms). */
export const pressScaleClasses =
  "transition-transform duration-150 ease-standard active:scale-[0.98] motion-reduce:active:scale-100";

/** Wraps its single child (a Link, button or card) and adds the press scale to it. */
function PressScale({ className, ...props }: ComponentProps<typeof Slot.Root>) {
  return <Slot.Root className={cn(pressScaleClasses, className)} {...props} />;
}

export { PressScale };
