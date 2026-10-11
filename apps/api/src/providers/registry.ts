import { FlightOfferSchema, type FlightOffer, type FlightSearch } from "@waafa/shared";
import type { FlightProvider, ProviderContext } from "./adapters";

/** One active flight connection: its adapter and its opened context. */
export type ActiveFlightSource = { provider: FlightProvider; context: ProviderContext };

export type FlightSearchResult = {
  offers: FlightOffer[];
  /** Providers that failed, timed out or sent offers that did not match the shared schema. */
  failures: Array<{ provider: string; message: string }>;
};

/** Same flights on the same days from two providers: one row, the cheaper one wins. */
export function offerKey(offer: FlightOffer): string {
  return offer.slices
    .flatMap((slice) =>
      slice.segments.map(
        (segment) => `${segment.marketingCarrier.code}${segment.flightNumber}@${segment.departAt}`,
      ),
    )
    .join("|");
}

export function dedupeOffers(offers: FlightOffer[]): FlightOffer[] {
  const best = new Map<string, FlightOffer>();
  for (const offer of offers) {
    const key = offerKey(offer);
    const current = best.get(key);
    if (!current || offer.totalPrice < current.totalPrice) best.set(key, offer);
  }
  return [...best.values()].sort((a, b) => a.totalPrice - b.totalPrice);
}

/** Settles within `ms` even when an adapter ignores its abort signal. */
export function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`No answer within ${ms / 1000} s`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/**
 * The provider registry's search (FR-GS-07): every active provider in parallel, each with its own time limit; offers
 * are checked against the shared schema (a malformed offer is dropped, never shown), merged, de-duplicated and sorted
 * by price. A slow or failing provider never blocks the others; with no offers at all the module falls back to Manual.
 */
export async function searchFlights(
  sources: ActiveFlightSource[],
  query: FlightSearch,
  timeoutMs = 8_000,
): Promise<FlightSearchResult> {
  const failures: FlightSearchResult["failures"] = [];
  const settled = await Promise.allSettled(
    sources.map(({ provider, context }) =>
      withTimeout(
        provider.search(query, { ...context, signal: AbortSignal.timeout(timeoutMs) }),
        timeoutMs,
      ),
    ),
  );
  const offers: FlightOffer[] = [];
  settled.forEach((result, index) => {
    const id = sources[index]?.provider.id ?? "unknown";
    if (result.status === "rejected") {
      const reason = result.reason as unknown;
      failures.push({
        provider: id,
        message: reason instanceof Error ? reason.message : "Search failed",
      });
      return;
    }
    let dropped = 0;
    for (const raw of result.value) {
      const parsed = FlightOfferSchema.safeParse(raw);
      if (parsed.success) offers.push(parsed.data);
      else dropped += 1;
    }
    if (dropped > 0)
      failures.push({ provider: id, message: `${dropped} offers did not match the schema` });
  });
  return { offers: dedupeOffers(offers), failures };
}
