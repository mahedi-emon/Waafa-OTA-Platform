"use client";

import type { LiveEvent } from "@waafa/shared";

/*
 * The real-time stream for the admin (issue 243): one EventSource per tab on /secure-admin-control/api/events. Each
 * `live` event goes to the listeners (the bell plays the chime and reloads its numbers). The browser reconnects by
 * itself after a dropped connection; when the server refuses (signed out, API down) the stream waits 30 s, then
 * doubles up to 5 minutes. The 30-second inbox poll keeps running underneath, so the stream only makes things sooner.
 */

const ENDPOINT = "/secure-admin-control/api/events";
const FIRST_WAIT = 30_000;
const LONGEST_WAIT = 5 * 60_000;

type Listener = (event: LiveEvent) => void;

const listeners = new Set<Listener>();
let source: EventSource | null = null;
let wait = FIRST_WAIT;
let timer: ReturnType<typeof setTimeout> | null = null;
let connected = false;

/** Reads one `live` event; anything malformed is ignored. */
export function parseLiveEvent(data: string): LiveEvent | null {
  try {
    const value = JSON.parse(data) as Partial<LiveEvent>;
    if (!value || typeof value !== "object") return null;
    if (!["lead", "order", "proof", "alert"].includes(String(value.type))) return null;
    if (typeof value.title !== "string" || typeof value.href !== "string") return null;
    if (!value.href.startsWith("/secure-admin-control")) return null;
    return {
      type: value.type as LiveEvent["type"],
      title: value.title,
      detail: typeof value.detail === "string" ? value.detail : "",
      href: value.href,
      at: typeof value.at === "string" ? value.at : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function retryLater() {
  source?.close();
  source = null;
  connected = false;
  if (timer || listeners.size === 0) return;
  timer = setTimeout(() => {
    timer = null;
    connect();
  }, wait);
  wait = Math.min(wait * 2, LONGEST_WAIT);
}

function connect() {
  if (source || listeners.size === 0 || typeof EventSource === "undefined") return;
  const stream = new EventSource(ENDPOINT);
  source = stream;
  stream.addEventListener("ready", () => {
    connected = true;
    wait = FIRST_WAIT;
  });
  stream.addEventListener("live", (message) => {
    const event = parseLiveEvent((message as MessageEvent<string>).data);
    if (!event) return;
    for (const listener of listeners) listener(event);
  });
  stream.addEventListener("error", () => {
    // CLOSED: the server answered with an error (no reconnect from the browser). CONNECTING: a dropped line the
    // browser retries on its own, unless it never got through at all.
    if (stream.readyState === EventSource.CLOSED || !connected) retryLater();
  });
}

/** Starts listening (the first listener opens the stream); returns the function that stops it. */
export function onLiveEvent(listener: Listener): () => void {
  listeners.add(listener);
  connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    source?.close();
    source = null;
    connected = false;
    if (timer) clearTimeout(timer);
    timer = null;
  };
}
