"use client";

import { useSyncExternalStore } from "react";

type DealCountdownProps = {
  /** ISO timestamp with offset. */
  endsAt: string;
  labels: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    ended: string;
    label: string;
  };
};

function subscribe(onTick: () => void): () => void {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Deal timer (Shop "Deals of the week"): days, hours, minutes and seconds to the end, computed on the client (the
 * server never bakes in the time). Screen readers get one summary, not a ticking live region.
 */
function DealCountdown({ endsAt, labels }: DealCountdownProps) {
  const now = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );
  const end = Math.floor(new Date(endsAt).getTime() / 1000);
  if (now === 0) {
    return <span aria-hidden="true" className="inline-block h-10 w-56 rounded-xl bg-mist-100" />;
  }
  const left = Math.max(0, end - now);
  if (left === 0)
    return <span className="text-[14px] font-semibold text-mist-600">{labels.ended}</span>;
  const parts = [
    { value: Math.floor(left / 86_400), label: labels.days },
    { value: Math.floor((left % 86_400) / 3600), label: labels.hours },
    { value: Math.floor((left % 3600) / 60), label: labels.minutes },
    { value: left % 60, label: labels.seconds },
  ];

  return (
    <span
      role="timer"
      aria-label={`${labels.label}: ${parts
        .slice(0, 3)
        .map((part) => `${part.value} ${part.label}`)
        .join(", ")}`}
      className="inline-flex items-center gap-1.5"
    >
      {parts.map((part, index) => (
        <span key={part.label} aria-hidden="true" className="inline-flex items-center gap-1.5">
          <span className="flex min-w-11 flex-col items-center rounded-xl bg-navy-900 px-2 py-1 text-white">
            <span className="font-display text-[17px] leading-tight font-extrabold tabular-nums">
              {pad(part.value)}
            </span>
            <span className="text-[10.5px] text-white/70">{part.label}</span>
          </span>
          {index < parts.length - 1 ? <span className="font-bold text-mist-400">:</span> : null}
        </span>
      ))}
    </span>
  );
}

export { DealCountdown };
