"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveEvent } from "@waafa/shared";
import { armChime, playChime } from "@/lib/admin/chime";
import { onLiveEvent } from "./liveEvents";
import { pollInboxNow } from "./useInboxSummary";

type LiveAlertsProps = {
  /** Play the chime (the person's switch in the bell, kept on this device). */
  sound: boolean;
  /** Words read to screen readers for each kind of event, e.g. "New request". */
  labels: Record<LiveEvent["type"], string>;
};

/**
 * Listens to the real-time stream (issue 243): reloads the bell and badges at once, plays the chime when sound is on,
 * and tells screen readers what arrived through a polite status message.
 */
function LiveAlerts({ sound, labels }: LiveAlertsProps) {
  const [message, setMessage] = useState("");
  const settings = useRef({ sound, labels });
  useEffect(() => {
    settings.current = { sound, labels };
  }, [sound, labels]);

  useEffect(() => {
    armChime();
    return onLiveEvent((event) => {
      pollInboxNow();
      if (settings.current.sound) playChime();
      setMessage(`${settings.current.labels[event.type]}: ${event.title}`);
    });
  }, []);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}

export { LiveAlerts };
