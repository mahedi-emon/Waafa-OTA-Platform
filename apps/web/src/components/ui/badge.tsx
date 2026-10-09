import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

/**
 * Badges (Components board): 24 px, radius 6, Inter 600 12 px. Status always pairs colour with a word or icon.
 * `premium` is the navy badge that carries the gold triangle (pass <GoldTriangle /> as the first child).
 */
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xs px-2.5 text-xs leading-none font-semibold tracking-[0.005em] whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-mist-100 text-mist-700",
        brand: "bg-electric-50 text-brand-700",
        premium: "bg-navy-900 text-white",
        success: "bg-success-50 text-success-600",
        warning: "bg-warning-50 text-warning-700",
        danger: "bg-danger-50 text-danger-600",
        discount: "bg-danger-600 font-bold text-white",
        outline:
          "h-5 border border-mist-300 bg-white px-1.5 text-[10.5px] tracking-[0.08em] text-mist-600 uppercase",
        glass: "bg-white/14 text-white ring-1 ring-white/25 backdrop-blur-sm ring-inset",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
