import "server-only";
import { createFixtureRepositories } from "../fixtures/createFixtureRepositories";
import type { Repositories } from "../types";
import { readSnapshot } from "./snapshot";

/** Writes never run on the snapshot: in API mode they go to the API through `lib/data/intake.ts`. */
const WRITES = new Set([
  "createLead",
  "logSearch",
  "submitPaymentProof",
  "listSearchLogs",
  "createFeedback",
  "createOrder",
  "findOrder",
]);

/**
 * The repositories in API mode (Phase C): every read runs the tested fixture implementation on the latest snapshot
 * from the API, so pages render the same data the same way whichever source is behind them.
 */
export function createApiRepositories(): Repositories {
  const area = <K extends keyof Repositories>(key: K): Repositories[K] =>
    new Proxy({} as Repositories[K], {
      get(_target, method) {
        if (typeof method !== "string") return undefined;
        if (WRITES.has(method)) {
          return () => Promise.reject(new Error(`${key}.${method} goes to the API in API mode`));
        }
        return async (...args: unknown[]) => {
          const repositories = createFixtureRepositories(await readSnapshot());
          const target = repositories[key] as unknown as Record<
            string,
            (...input: unknown[]) => unknown
          >;
          const fn = target[method];
          if (typeof fn !== "function")
            throw new Error(`Unknown repository method ${key}.${method}`);
          return fn(...args);
        };
      },
    });
  return {
    settings: area("settings"),
    content: area("content"),
    travel: area("travel"),
    visa: area("visa"),
    shop: area("shop"),
    leads: area("leads"),
  };
}
