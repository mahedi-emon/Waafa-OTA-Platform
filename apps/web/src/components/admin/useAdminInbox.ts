"use client";

import type { InboxSummary } from "@waafa/shared";
import { useAdminNav } from "./AdminNavContext";
import { useInboxSummary } from "./useInboxSummary";

/** The freshest inbox summary: the poller's answer, else what the page was rendered with. */
export function useAdminInbox(): {
  summary: InboxSummary | null;
  stale: boolean;
  signedOut: boolean;
} {
  const { initialInbox } = useAdminNav();
  const live = useInboxSummary();
  return { summary: live.summary ?? initialInbox, stale: live.stale, signedOut: live.signedOut };
}
