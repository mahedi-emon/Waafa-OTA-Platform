"use client";

import { useSyncExternalStore } from "react";
import { getOfficeStatus, type OfficeStatus, type OpeningHours } from "@waafa/shared";

/** Re-renders every minute so "Open now" flips at opening and closing time without a reload. */
function subscribeToMinutes(onTick: () => void): () => void {
  const id = window.setInterval(onTick, 60_000);
  return () => window.clearInterval(id);
}

/** The current minute as a number keeps the snapshot stable between renders within the same minute. */
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

/**
 * Office status in Asia/Dhaka, computed on the client only: `null` during server rendering and hydration, so cached
 * pages never show a stale status and server and client markup always match.
 */
export function useOfficeStatus(hours: OpeningHours): OfficeStatus | null {
  const minute = useSyncExternalStore(subscribeToMinutes, currentMinute, serverMinute);
  return minute === null ? null : getOfficeStatus(hours, new Date(minute * 60_000));
}
