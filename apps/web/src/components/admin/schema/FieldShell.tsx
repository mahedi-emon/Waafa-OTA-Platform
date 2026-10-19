"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { describedBy } from "./fieldIds";

type FieldShellProps = {
  id: string;
  label: string;
  help?: string;
  /** Shows "Optional" after the label. */
  optional?: boolean;
  error?: string;
  /** Characters used and allowed ("12 of 60"), for texts with a limit. */
  counter?: { count: number; max: number };
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
  const over = counter ? counter.count > counter.max : false;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex min-h-6 items-end justify-between gap-2">
        {group ? (
          <span id={labelId} className="text-[14px] leading-tight font-semibold text-navy-900">
            {title}
          </span>
        ) : (
          <label
            id={labelId}
            htmlFor={id}
            className="text-[14px] leading-tight font-semibold text-navy-900"
          >
            {title}
          </label>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {counter ? (
            <span
              className={cn(
                "text-[12px] tabular-nums",
                over ? "font-semibold text-danger-700" : "text-mist-500",
              )}
              aria-live={over ? "polite" : undefined}
            >
              {t("counter", { count: counter.count, max: counter.max })}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
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
