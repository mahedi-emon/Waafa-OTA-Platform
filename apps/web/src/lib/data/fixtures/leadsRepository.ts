import type { FixtureData } from "@waafa/fixtures";
import {
  LEAD_PREFIX,
  LeadCreateInputSchema,
  PaymentProofInputSchema,
  SearchLogInputSchema,
  makeReference,
  toDhakaDateString,
  toDhakaIsoString,
  type PaymentProof,
  type SearchLog,
} from "@waafa/shared";
import { paginate } from "../query";
import type { LeadsRepository } from "../types";

const MAX_LOGGED_SEARCHES = 1000;

/**
 * Phase A lead intake: validates the submission and hands back a well-formed reference so the success
 * screens can be built and tested. Leads are not stored or sent; Phase C replaces this with the API, which
 * assigns sequences atomically and alerts staff. Sequences restart whenever the server restarts.
 * Searches are kept in memory next to the Sample ones, so Admin › Search activity can be tested.
 */
export function createFixtureLeadsRepository(data: FixtureData): LeadsRepository {
  const sequences = new Map<string, number>();
  /** Searches logged since the server started, newest first; capped so the dev server cannot grow forever. */
  const logged: SearchLog[] = [];
  let nextLogId = 1;
  /** Payment proofs received since the server started, newest first (Phase A, in memory). */
  const proofs: PaymentProof[] = [];

  return {
    async createLead(input, now) {
      const lead = LeadCreateInputSchema.parse(input);
      const prefix = LEAD_PREFIX[lead.payload.module];
      const key = `${prefix}:${toDhakaDateString(now)}`;
      const sequence = (sequences.get(key) ?? 0) + 1;
      sequences.set(key, sequence);
      return { reference: makeReference(prefix, now, sequence), createdAt: toDhakaIsoString(now) };
    },

    async logSearch(input, now) {
      const search = SearchLogInputSchema.parse(input);
      logged.unshift({
        ...search,
        id: `search-live-${nextLogId}`,
        createdAt: toDhakaIsoString(now),
        sample: false,
      });
      nextLogId += 1;
      logged.length = Math.min(logged.length, MAX_LOGGED_SEARCHES);
    },

    async submitPaymentProof(input, now) {
      const proof = PaymentProofInputSchema.parse(input);
      const stored: PaymentProof = {
        ...proof,
        id: `proof-live-${proofs.length + 1}`,
        status: "received",
        createdAt: toDhakaIsoString(now),
        sample: false,
      };
      proofs.unshift(stored);
      return stored;
    },

    async listSearchLogs(query = {}) {
      const all = [...logged, ...data.searchLogs]
        .filter((log) => !query.module || log.module === query.module)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return paginate(all, query, 25);
    },
  };
}
