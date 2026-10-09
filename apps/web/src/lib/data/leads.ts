import "server-only";
import { LeadCreateInputSchema, type LeadCreated } from "@waafa/shared";
import { repositories } from "./source";

/**
 * Validates a public form submission against the shared contract and records it as a lead. Server
 * actions call this; it is never cached, because every call is a write.
 */
export async function createLead(input: unknown): Promise<LeadCreated> {
  return repositories.leads.createLead(LeadCreateInputSchema.parse(input), new Date());
}
