"use client";

import { useEffect } from "react";
import { TRACK_EVENT, type ConversionEvent, type TrackParams } from "@/lib/analytics/track";
import {
  linkConversion,
  onceKey,
  sendConversion,
  type AnalyticsWindow,
} from "@/lib/analytics/sendConversion";

const analyticsWindow = () => window as unknown as AnalyticsWindow;

/**
 * Sends conversions after consent (issue 237): rendered only with the analytics scripts, so before "Accept" nothing is
 * sent. Listens for `track()` announcements and for taps on call and WhatsApp links anywhere on the site.
 */
function EventBridge() {
  useEffect(() => {
    const sent = new Set<string>();
    function onTrack(event: Event) {
      const detail = (event as CustomEvent<{ name: ConversionEvent; params: TrackParams }>).detail;
      // A reference (lead, order, proof) is counted once even if the success screen renders twice.
      const once = onceKey(detail.name, detail.params);
      if (once && sent.has(once)) return;
      if (once) sent.add(once);
      sendConversion(analyticsWindow(), detail.name, detail.params);
    }
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const name = linkConversion(link?.getAttribute("href") ?? "");
      if (name) sendConversion(analyticsWindow(), name, {});
    }
    window.addEventListener(TRACK_EVENT, onTrack);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener(TRACK_EVENT, onTrack);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);
  return null;
}

export { EventBridge };
