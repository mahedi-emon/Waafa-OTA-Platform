"use client";

import { createContext, useContext, type ReactNode } from "react";

const TurnstileKeyContext = createContext<string | undefined>(undefined);

type TurnstileKeyProviderProps = { siteKey: string | null; children: ReactNode };

/**
 * The Turnstile site key from Admin › Integrations (issue 284), read by the server at run time and handed to every
 * public form below; no key means Turnstile is off. Replaces the build-time NEXT_PUBLIC variable.
 */
function TurnstileKeyProvider({ siteKey, children }: TurnstileKeyProviderProps) {
  return (
    <TurnstileKeyContext.Provider value={siteKey ?? undefined}>
      {children}
    </TurnstileKeyContext.Provider>
  );
}

/** The site key for useTurnstile; undefined while Turnstile is off. */
function useTurnstileSiteKey(): string | undefined {
  return useContext(TurnstileKeyContext);
}

export { TurnstileKeyProvider, useTurnstileSiteKey };
