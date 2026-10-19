"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { describedBy } from "./fieldIds";
import { useQuietLabel } from "./useQuietLabel";

type FieldShellProps = {
  id: string;
  label: string;
  help?: string;
  /** Shows "Optional" after the label. */
  optional?: boolean;
  error?: string;
  /**
   * Characters used and allowed ("12 of 60"), for texts with a limit. A soft limit (what Google shows) warns instead
   * of failing.
   */
  counter?: { count: number; max: number; soft?: boolean };
  /** Inline actions next to the label (clear, remove). */
  actions?: ReactNode;
  /**
   * The control is a group (radio cards, chips, a list): the label names the group through aria-labelledby instead of
   * pointing at one input.
   */
  group?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label, one line of help, the control, then the error (announced) for one field of the editor (ADMIN.md §6). */
function FieldShell({
  id,
  label,
  help,
  optional = false,
  error,
  counter,
  actions,
  group = false,
  className,
  children,
}: FieldShellProps) {
  const t = useTranslations("Admin.editor.widgets");
  // The only field of a section with the same name keeps its label for screen readers only.
  const quiet = useQuietLabel(id, label);
  const labelId = `${id}-label`;
  const helpId = help ? `${id}-help` : undefined;
  const title = (
    <>
      {label}
      {optional ? (
        <span className="ml-1.5 text-[12.5px] font-normal text-mist-500">{t("optional")}</span>
      ) : null}
    </>
  );
  const labelClass = quiet ? "sr-only" : "text-[14px] leading-tight font-semibold text-navy-900";
  const name = group ? (
    <span id={labelId} className={labelClass}>
      {title}
    </span>
  ) : (
    <label id={labelId} htmlFor={id} className={labelClass}>
      {title}
    </label>
  );
  const over = counter ? counter.count > counter.max : false;
  const side =
    counter || actions ? (
      <div className="flex shrink-0 items-center gap-2">
        {counter ? (
          <span
            className={cn(
              "text-[12px] tabular-nums",
              over
                ? counter?.soft
                  ? "font-semibold text-warning-800"
                  : "font-semibold text-danger-700"
                : "text-mist-500",
            )}
            aria-live={over ? "polite" : undefined}
          >
            {t("counter", { count: counter.count, max: counter.max })}
          </span>
        ) : null}
        {actions}
      </div>
    ) : null;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {quiet && !side ? (
        name
      ) : (
        <div
          className={cn("flex min-h-6 items-end gap-2", quiet ? "justify-end" : "justify-between")}
        >
          {name}
          {side}
        </div>
      )}
      {help ? (
        <p id={helpId} className="-mt-0.5 text-[13.5px] leading-snug text-mist-600">
          {help}
        </p>
      ) : null}
      {group ? (
        <div
          role="group"
          aria-labelledby={labelId}
          aria-describedby={describedBy(id, help, error)}
          className="min-w-0"
        >
          {children}
        </div>
      ) : (
        children
      )}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { FieldShell };
