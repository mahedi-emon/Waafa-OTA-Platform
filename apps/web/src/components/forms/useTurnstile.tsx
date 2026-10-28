"use client";

import { useRef, useState, type ReactNode } from "react";
import { useTurnstileSiteKey } from "./TurnstileKeyProvider";
import { TurnstileWidget } from "./TurnstileWidget";

const WAIT_MS = 10_000;

export type TurnstileControls = {
  /** Start loading the widget (call on the form's first focus, so pages don't pay for it on load). */
  activate: () => void;
  /** The current token, waiting up to ten seconds for the first one; undefined when Turnstile is off. */
  getToken: () => Promise<string | undefined>;
  /** After a submit: tokens are single use. */
  reset: () => void;
  /** Place this inside the form, near the submit button. */
  field: ReactNode;
};

/** Turnstile for a public form; everything is a no-op until Turnstile is On in Admin › Integrations (issues 69 and 284). */
export function useTurnstile(): TurnstileControls {
  const SITE_KEY = useTurnstileSiteKey();
  const [active, setActive] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const token = useRef<string | undefined>(undefined);
  const waiters = useRef<Array<(value: string | undefined) => void>>([]);

  function onToken(next: string | undefined) {
    token.current = next;
    if (!next) return;
    for (const resolve of waiters.current) resolve(next);
    waiters.current = [];
  }

  function activate() {
    if (SITE_KEY && !active) setActive(true);
  }

  function getToken(): Promise<string | undefined> {
    if (!SITE_KEY) return Promise.resolve(undefined);
    if (!active) setActive(true);
    if (token.current) return Promise.resolve(token.current);
    return new Promise((resolve) => {
      waiters.current.push(resolve);
      window.setTimeout(() => resolve(token.current), WAIT_MS);
    });
  }

  function reset() {
    token.current = undefined;
    setResetSignal((value) => value + 1);
  }

  return {
    activate,
    getToken,
    reset,
    field:
      SITE_KEY && active ? (
        <TurnstileWidget siteKey={SITE_KEY} onToken={onToken} resetSignal={resetSignal} />
      ) : null,
  };
}
