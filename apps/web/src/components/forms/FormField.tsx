import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "cn";

type FormFieldProps = {
  /** id of the control; the hint and error ids derive from it. */
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  /** Receives the ids to put on the control's aria-describedby. */
  children: (describedBy: string | undefined) => ReactNode;
};

/**
 * Label above, control, hint, then the error in danger with an icon (DESIGN.md "Inputs"). The control gets
 * aria-describedby for both, so screen readers read the hint and the error with it.
 */
function FormField({ id, label, hint, error, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[14px] font-semibold text-ink-900">
        {label}
      </label>
      {children(describedBy)}
      {hint ? (
        <p id={hintId} className="text-[13px] text-mist-600">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-[13px] leading-snug text-danger-600"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
