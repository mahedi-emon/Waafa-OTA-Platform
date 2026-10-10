"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { fieldDomId, fieldErrorCode, useSearchCard } from "./SearchCardContext";

type SearchFieldProps = {
  fieldId: string;
  label: string;
  value: string;
  /** IATA code after the city, e.g. "DAC". */
  code?: string;
  sub?: string;
  /** Placeholder styling: nothing chosen yet. */
  empty?: boolean;
  /** Leading mark, e.g. a country-code chip. */
  leading?: ReactNode;
  active: boolean;
  onOpen: () => void;
  className?: string;
  /** Extra classes for the button, e.g. room for the swap button. */
  buttonClassName?: string;
};

const SHAKE: Keyframe[] = [
  { transform: "translateX(0)" },
  { transform: "translateX(-6px)" },
  { transform: "translateX(6px)" },
  { transform: "translateX(-4px)" },
  { transform: "translateX(4px)" },
  { transform: "translateX(0)" },
];

/**
 * One tappable field of the search card (Label / value / sub line). It opens its picker; errors show under it,
 * are linked with aria-describedby and shake the field once per failed submit (transform only).
 */
function SearchField({
  fieldId,
  label,
  value,
  code,
  sub,
  empty,
  leading,
  active,
  onOpen,
  className,
  buttonClassName,
}: SearchFieldProps) {
  const t = useTranslations("Search.errors");
  const { state, errorNonce } = useSearchCard();
  const error = fieldErrorCode(state, fieldId);
  const ref = useRef<HTMLButtonElement>(null);
  const id = fieldDomId(fieldId);
  const errorId = `${id}-error`;

  useEffect(() => {
    if (!error || errorNonce === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(SHAKE, { duration: 400, easing: "cubic-bezier(0.2, 0, 0, 1)" });
  }, [error, errorNonce]);

  return (
    <div className={cn("min-w-0", className)}>
      <button
        ref={ref}
        id={id}
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={active}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "group/field flex h-16 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 text-left transition-colors duration-150 outline-none min-[360px]:px-4",
          "hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40",
          active ? "border-electric-600 bg-electric-50/60 ring-3 ring-ring/20" : "border-mist-200",
          error && "border-danger-600 bg-danger-25 ring-3 ring-danger-600/15",
          buttonClassName,
        )}
      >
        {leading}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-caption text-mist-600">{label}</span>
          <span
            className={cn(
              "truncate text-[15px] leading-tight font-semibold tabular-nums min-[360px]:text-base",
              empty ? "text-mist-500" : "text-ink-900",
            )}
          >
            {value}
            {code ? (
              <span className="ml-1.5 font-display text-[13px] font-bold tracking-wide text-mist-500">
                {code}
              </span>
            ) : null}
          </span>
          {sub ? (
            <span className="truncate text-[12.5px] leading-tight text-mist-600">{sub}</span>
          ) : null}
        </span>
      </button>
      {error ? (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 px-1 text-[13px] leading-snug text-danger-600"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}

export { SearchField };
