"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loading: Promise<TurnstileApi> | null = null;

/** Loads the Turnstile script once per page, only when a form first needs it. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("Turnstile runs in the browser"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing"));
    script.onerror = () => {
      loading = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string | undefined) => void;
  /** Changes after each submit: tokens are single use, so the widget fetches a new one. */
  resetSignal: number;
};

/**
 * Cloudflare Turnstile (CLAUDE.md "Always"): the managed widget, shown only when Cloudflare needs the visitor to
 * interact; otherwise it works out of sight and hands the form a token.
 */
function TurnstileWidget({ siteKey, onToken, resetSignal }: TurnstileWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const tokenHandler = useRef(onToken);

  useEffect(() => {
    tokenHandler.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current || widgetId.current) return;
        widgetId.current = api.render(container.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          "refresh-expired": "auto",
          callback: (token: string) => tokenHandler.current(token),
          "expired-callback": () => tokenHandler.current(undefined),
          "error-callback": () => tokenHandler.current(undefined),
        });
      })
      .catch(() => tokenHandler.current(undefined));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile)
      window.turnstile.reset(widgetId.current);
  }, [resetSignal]);

  return <div ref={container} className="empty:hidden" />;
}

export { TurnstileWidget };
