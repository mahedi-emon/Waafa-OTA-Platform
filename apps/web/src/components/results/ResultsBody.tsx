import type { ReactNode } from "react";
import type { BookingMode } from "@waafa/shared";

type ResultsBodyProps = { mode: BookingMode; manual: ReactNode; live: ReactNode };

/**
 * The one switch between booking modes (FR-GS-02): results pages render the Manual body or the Live body from the
 * public config only, so an admin flips a module without a deploy. Live bodies arrive in Phase E.
 */
function ResultsBody({ mode, manual, live }: ResultsBodyProps) {
  return <>{mode === "live" ? live : manual}</>;
}

export { ResultsBody };
