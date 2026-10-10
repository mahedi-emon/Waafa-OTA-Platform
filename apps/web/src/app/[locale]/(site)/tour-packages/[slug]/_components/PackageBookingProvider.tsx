"use client";

import { createContext, useMemo, useState, type ReactNode } from "react";
import type { TourPackage } from "@waafa/shared";
import { packageQueryDefaults, type PackageQueryInput } from "@/lib/leads/packageLeadForm";

type PackageBooking = {
  query: PackageQueryInput;
  /** Bumped by the booking card, so an open query form remounts with the new choices. */
  revision: number;
  /** From the query form itself (back or submit): no remount. */
  saveQuery: (query: PackageQueryInput) => void;
  /** From the booking card: departure, travellers or room changed. */
  updateFromCard: (patch: Partial<PackageQueryInput>) => void;
};

const PackageBookingContext = createContext<PackageBooking | null>(null);

type PackageBookingProviderProps = {
  pkg: Pick<TourPackage, "departures" | "anyDate" | "prices">;
  children: ReactNode;
};

/**
 * Shares the booking card choices (departure, travellers, room) with the query form below, so "Send query" opens the
 * form already filled in (PackageDetail → PackageDetail-query).
 */
function PackageBookingProvider({ pkg, children }: PackageBookingProviderProps) {
  const [state, setState] = useState(() => ({ query: packageQueryDefaults(pkg), revision: 0 }));
  const value = useMemo<PackageBooking>(
    () => ({
      query: state.query,
      revision: state.revision,
      saveQuery: (query) => setState((current) => ({ ...current, query })),
      updateFromCard: (patch) =>
        setState((current) => ({
          query: { ...current.query, ...patch },
          revision: current.revision + 1,
        })),
    }),
    [state],
  );
  return <PackageBookingContext value={value}>{children}</PackageBookingContext>;
}

export { PackageBookingContext, PackageBookingProvider };
