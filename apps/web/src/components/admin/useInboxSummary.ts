"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { InboxCountKey, InboxSummary } from "@waafa/shared";
import { markSignedOut } from "./sessionStore";

/** Polls what waits for this person (sidebar badges, the bell) every 30 s while the tab is visible (ADMIN.md §3.2). */
const ENDPOINT = "/secure-admin-control/api/inbox";
const INTERVAL = 30_000;

type InboxState = {
  summary: InboxSummary | null;
  /** The last poll failed (offline or the API didn't answer); the last good numbers stay on screen. */
  stale: boolean;
  /** The session ended: polling stops until the next page load. */
  signedOut: boolean;
};

let state: InboxState = { summary: null, stale: false, signedOut: false };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight = false;

function emit(next: InboxState) {
  state = next;
  for (const listener of listeners) listener();
}

async function poll() {
  if (inflight || state.signedOut || document.visibilityState === "hidden") return;
  inflight = true;
  try {
    const response = await fetch(ENDPOINT, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const json = (response.headers.get("content-type") ?? "").includes("application/json");
    if (response.status === 401 || response.redirected || !json) {
      emit({ ...state, signedOut: true });
      markSignedOut();
      stop();
      return;
    }
    if (!response.ok) {
      emit({ ...state, stale: true });
      return;
    }
    emit({ summary: (await response.json()) as InboxSummary, stale: false, signedOut: false });
  } catch {
    emit({ ...state, stale: true });
  } finally {
    inflight = false;
  }
}

function onVisible() {
  if (document.visibilityState === "visible") void poll();
}

function start() {
  if (timer) return;
  timer = setInterval(() => void poll(), INTERVAL);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onVisible);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("online", onVisible);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

const getServerSnapshot = () => state;

/** Seeds the store with the numbers the server rendered, so badges show on first paint without a jump. */
export function useSeedInboxSummary(initial: InboxSummary | null) {
  useEffect(() => {
    if (initial && (!state.summary || state.summary.at < initial.at))
      emit({ summary: initial, stale: false, signedOut: false });
  }, [initial]);
}

/** The latest summary for this person (null until the first answer). */
export function useInboxSummary(): InboxState {
  return useSyncExternalStore(subscribe, () => state, getServerSnapshot);
}

/** One count, 0 when the person can't see that queue or nothing waits. */
export function countOf(summary: InboxSummary | null, key: InboxCountKey | undefined): number {
  if (!summary || !key) return 0;
  return summary.counts[key] ?? 0;
}
