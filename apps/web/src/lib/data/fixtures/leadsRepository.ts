import {
  LEAD_PREFIX,
  LeadCreateInputSchema,
  makeReference,
  toDhakaDateString,
  toDhakaIsoString,
} from "@waafa/shared";
import type { LeadsRepository } from "../types";

/**
 * Phase A lead intake: validates the submission and hands back a well-formed reference so the success
 * screens can be built and tested. Nothing is stored or sent; Phase C replaces this with the API, which
 * assigns sequences atomically and alerts staff. Sequences restart whenever the server restarts.
 */
export function createFixtureLeadsRepository(): LeadsRepository {
  const sequences = new Map<string, number>();

  return {
    async createLead(input, now) {
      const lead = LeadCreateInputSchema.parse(input);
      const prefix = LEAD_PREFIX[lead.payload.module];
      const key = `${prefix}:${toDhakaDateString(now)}`;
      const sequence = (sequences.get(key) ?? 0) + 1;
      sequences.set(key, sequence);
      return { reference: makeReference(prefix, now, sequence), createdAt: toDhakaIsoString(now) };
    },
  };
}
