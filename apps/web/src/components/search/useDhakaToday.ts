"use client";

import { useSyncExternalStore } from "react";
import { todayInDhaka } from "@/lib/search/isoDate";

const DAY_MS = 86_400_000;
const DHAKA_OFFSET_MS = 6 * 3_600_000; // Asia/Dhaka is UTC+6 all year (no daylight saving).

/** Re-reads the date at the next Dhaka midnight, so a card left open overnight never validates against yesterday. */
function subscribe(onChange: () => void): () => void {
  let timer = 0;
  const schedule = () => {
    const untilMidnight = DAY_MS - ((Date.now() + DHAKA_OFFSET_MS) % DAY_MS) + 1_000;
    timer = window.setTimeout(() => {
      onChange();
      schedule();
    }, untilMidnight);
  };
  schedule();
  return () => window.clearTimeout(timer);
}

/** Today in Asia/Dhaka, read on the client only (static pages must not bake in the build date). "" on the server. */
export function useDhakaToday(): string {
  return useSyncExternalStore(
    subscribe,
    () => todayInDhaka(),
    () => "",
  );
}
