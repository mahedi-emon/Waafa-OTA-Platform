import type { ReactNode } from "react";

type FieldShellProps = {
  id: string;
  label: string;
  optional?: string;
  hint?: string;
  error?: string;
  /** Inline actions next to the label (clear, remove). */
  actions?: ReactNode;
  children: ReactNode;
};

/** Label, control, hint and error for one field of the generic editor; the error is announced. */
function FieldShell({ id, label, optional, hint, error, actions, children }: FieldShellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-semibold text-navy-900">
          {label}
          {optional ? (
            <span className="ml-1.5 text-[12.5px] font-normal text-mist-500">({optional})</span>
          ) : null}
        </label>
        {actions ? <div className="flex shrink-0 gap-1">{actions}</div> : null}
      </div>
      {children}
      {hint ? <p className="text-[12.5px] text-mist-600">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { FieldShell };
