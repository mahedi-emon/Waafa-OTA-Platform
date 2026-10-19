"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDhakaDateTime } from "@/lib/admin/format";

type RelativeTimeProps = { iso: string; className?: string };

/**
 * "5 min ago" once the page is interactive, the full Asia/Dhaka date and time before that (and on hover), so the
 * server and the browser never disagree while hydrating.
 */
function RelativeTime({ iso, className }: RelativeTimeProps) {
  const hydrated = useHydrated();
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const exact = formatDhakaDateTime(iso);
  return (
    <time dateTime={iso} title={exact} className={className}>
      {hydrated ? formatDistanceToNowStrict(date, { addSuffix: true }) : exact}
    </time>
  );
}

export { RelativeTime };
