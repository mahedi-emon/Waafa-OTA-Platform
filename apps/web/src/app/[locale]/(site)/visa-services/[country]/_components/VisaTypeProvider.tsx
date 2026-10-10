"use client";

import { createContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import type { VisaTypeKey } from "@waafa/shared";

type VisaTypeChoice = { type: VisaTypeKey; setType: (type: VisaTypeKey) => void };

const VisaTypeContext = createContext<VisaTypeChoice | null>(null);

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

type VisaTypeProviderProps = { types: VisaTypeKey[]; children: ReactNode };

/**
 * The visa type chosen on a country page, shared by the tabs, the fee card and the phone bar. The page stays static:
 * `?type=` from the search card is read on the client and wins until the visitor picks another tab.
 */
function VisaTypeProvider({ types, children }: VisaTypeProviderProps) {
  const fromUrl = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get("type"),
    () => null,
  );
  const [picked, setPicked] = useState<VisaTypeKey | null>(null);
  const urlType = types.find((type) => type === fromUrl);
  const type = picked ?? urlType ?? types[0] ?? "tourist";
  const value = useMemo<VisaTypeChoice>(
    () => ({
      type,
      setType: (next) => {
        setPicked(next);
        // Keep the choice in the address, so a shared or reloaded link opens the same tab.
        const url = new URL(window.location.href);
        url.searchParams.set("type", next);
        window.history.replaceState(window.history.state, "", url);
      },
    }),
    [type],
  );
  return <VisaTypeContext value={value}>{children}</VisaTypeContext>;
}

export { VisaTypeContext, VisaTypeProvider };
