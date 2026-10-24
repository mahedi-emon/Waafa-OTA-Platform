"use client";

import { useEffect, useState } from "react";
import { AlarmClock, Timer } from "lucide-react";
import { replyTimer } from "@waafa/shared/workflow/leads";
import { StatusChip } from "@/components/admin/StatusChip";
import { useHydrated } from "@/hooks/use-hydrated";

type ReplyTimerProps = {
  status: string;
  firstResponseAt: string | null;
  createdAt: string;
  slaMinutes: number;
  strings: {
    /** Contains {time}: "Reply within 18 min". */
    left: string;
    /** Contains {time}: "No reply, 12 min past the target". */
    over: string;
    /** Why the timer shows, with {minutes}. */
    reason: string;
    /** Each contains {count}. */
    minutes: string;
    hours: string;
    days: string;
  };
};

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ""));

/** "18 min", "1 h 5 min", "2 d 3 h": the largest two units. */
function durationWords(minutes: number, strings: ReplyTimerProps["strings"]): string {
  const part = (text: string, count: number) => fill(text, { count });
  if (minutes < 60) return part(strings.minutes, minutes);
  if (minutes < 24 * 60) {
    const rest = minutes % 60;
    return [part(strings.hours, Math.floor(minutes / 60)), rest ? part(strings.minutes, rest) : ""]
      .filter(Boolean)
      .join(" ");
  }
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  return [
    part(strings.days, Math.floor(minutes / (24 * 60))),
    hours ? part(strings.hours, hours) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The reply timer on a new lead (D0 R6, ADMIN.md §5.5): it counts down to the reply target and then counts the
 * time past it, once a minute in the browser (time-dependent words render on the client). It goes away as soon as
 * someone replies.
 */
function ReplyTimer({ status, firstResponseAt, createdAt, slaMinutes, strings }: ReplyTimerProps) {
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!hydrated) return null;
  const timer = replyTimer({ status, firstResponseAt, createdAt }, slaMinutes, now);
  if (!timer) return null;
  const reason = fill(strings.reason, { minutes: slaMinutes });
  return timer.overdue ? (
    <StatusChip
      tone="danger"
      icon={AlarmClock}
      label={fill(strings.over, { time: durationWords(timer.minutesOver, strings) })}
      reason={reason}
      focusable
    />
  ) : (
    <StatusChip
      tone={timer.minutesLeft <= 10 ? "warning" : "info"}
      icon={Timer}
      label={fill(strings.left, { time: durationWords(Math.max(1, timer.minutesLeft), strings) })}
      reason={reason}
      focusable
    />
  );
}

export { ReplyTimer };
