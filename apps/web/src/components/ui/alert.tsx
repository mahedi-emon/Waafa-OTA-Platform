import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/** Inline notices (Components board, Feedback & status): tinted panel, icon in the tone colour, readable body text. */
const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-md px-4 py-3.5 text-left text-[14.5px] leading-relaxed text-mist-800 has-data-[slot=alert-action]:pr-24 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:mt-0.5 *:[svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        info: "bg-electric-50 *:[svg]:text-electric-600",
        success: "bg-success-50 *:[svg]:text-success-600",
        warning: "bg-warning-50 *:[svg]:text-warning-700",
        danger: "bg-danger-50 *:[svg]:text-danger-600",
        neutral: "border border-mist-200 bg-white *:[svg]:text-mist-600",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

function Alert({
  className,
  variant,
  role,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      // Errors interrupt; everything else is announced politely.
      role={role ?? (variant === "danger" ? "alert" : "status")}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold text-navy-900 group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-pretty group-has-[>svg]/alert:col-start-2 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-3",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-1/2 right-4 -translate-y-1/2", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
