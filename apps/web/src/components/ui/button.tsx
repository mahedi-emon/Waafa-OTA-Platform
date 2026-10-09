import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import { Spinner } from "@/components/ui/spinner";

/**
 * WAAFA buttons (Components board): full pills, 48 / 38 / 56 px, Inter 600, press scales to 0.975.
 * Hover darkens through an overlay whose opacity fades (MOTION.md: transform and opacity only).
 */
const buttonVariants = cva(
  [
    "group/button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
    "transition-transform duration-150 ease-standard active:scale-[0.975] motion-reduce:active:scale-100",
    "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-150 hover:before:opacity-100",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_8px_18px_-8px_rgb(0_83_215/0.6)] before:bg-black/12",
        secondary:
          "bg-white text-navy-900 shadow-[inset_0_0_0_1px_var(--color-mist-300)] before:bg-mist-100",
        navy: "bg-navy-900 text-white before:bg-white/10",
        soft: "bg-electric-50 text-brand-700 before:bg-electric-100",
        ghost: "bg-transparent text-navy-900 before:bg-mist-100",
        whatsapp:
          "bg-whatsapp-700 text-white shadow-[0_8px_18px_-10px_rgb(14_122_71/0.7)] before:bg-black/12",
        danger: "bg-danger-600 text-white before:bg-black/12",
        white:
          "bg-white text-navy-900 shadow-[0_8px_20px_-10px_rgb(2_13_57/0.5)] before:bg-mist-100",
        glass:
          "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.28)] backdrop-blur-md before:bg-white/10",
        link: "text-brand-700 underline-offset-4 before:hidden hover:underline active:scale-100",
      },
      size: {
        sm: "h-[38px] px-3.5 text-sm",
        md: "h-12 px-5 text-[15px]",
        lg: "h-14 px-7 text-base",
        icon: "size-11",
        "icon-sm": "size-[38px]",
        "icon-lg": "size-14",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Link) with button styles. `loading` is ignored then. */
    asChild?: boolean;
    /** Shows a spinner, keeps the button's width and blocks repeat presses. */
    loading?: boolean;
  };

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({ variant, size }),
        loading && "disabled:opacity-100",
        className,
      )}
      {...props}
    >
      <span className={cn("contents", loading && "invisible")}>{children}</span>
      {loading ? <Spinner className="absolute inset-0 m-auto" /> : null}
    </button>
  );
}

export { Button, buttonVariants, type ButtonProps };
