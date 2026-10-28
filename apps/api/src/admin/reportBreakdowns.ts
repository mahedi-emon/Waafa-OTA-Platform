import { visaStage, type VisaStage } from "@waafa/shared";
import { checklistOf, progressOf, visaFacts } from "../common/visaProgress";

/** The middle of a list of minutes, or null for none. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

type LeadFacts = {
  assigneeId: string | null;
  status: string;
  createdAt: Date;
  firstResponseAt: Date | null;
};

export type AgentRow = {
  staffId: string | null;
  name: string;
  leads: number;
  booked: number;
  wonRate: number;
  medianFirstResponseMinutes: number | null;
};

/**
 * Leads by the person they are assigned to (issue 244): how many, how many booked, the won rate and the median time
 * to the first reply. Unassigned leads are one row of their own; the busiest person first.
 */
export function byAgent(
  leads: LeadFacts[],
  names: Map<string, string>,
  unassigned: string,
): AgentRow[] {
  const groups = new Map<string | null, LeadFacts[]>();
  for (const lead of leads) {
    const list = groups.get(lead.assigneeId) ?? [];
    list.push(lead);
    groups.set(lead.assigneeId, list);
  }
  return [...groups.entries()]
    .map(([staffId, list]) => {
      const booked = list.filter((lead) => lead.status === "booked").length;
      return {
        staffId,
        name: staffId ? (names.get(staffId) ?? "Former staff") : unassigned,
        leads: list.length,
        booked,
        wonRate: Math.round((booked / list.length) * 1000) / 10,
        medianFirstResponseMinutes: median(
          list
            .filter((lead) => lead.firstResponseAt)
            .map((lead) =>
              Math.round((lead.firstResponseAt!.getTime() - lead.createdAt.getTime()) / 60_000),
            ),
        ),
      };
    })
    .sort((a, b) => b.leads - a.leads || a.name.localeCompare(b.name));
}

export type FunnelStep = {
  step: "searches" | "requests" | "replied" | "quoted" | "booked";
  count: number;
};

const QUOTED_OR_LATER = new Set(["quoted", "booked"]);

/**
 * From a search to a booking (issue 244): searches made, requests sent, requests answered, requests quoted (a quote
 * was written or the lead reached Quoted) and requests booked. Each step counts the leads of the period.
 */
export function funnel(
  searches: number,
  leads: Array<{ id: string; status: string; firstResponseAt: Date | null }>,
  quotedLeadIds: Set<string>,
): FunnelStep[] {
  return [
    { step: "searches", count: searches },
    { step: "requests", count: leads.length },
    { step: "replied", count: leads.filter((lead) => lead.firstResponseAt).length },
    {
      step: "quoted",
      count: leads.filter((lead) => QUOTED_OR_LATER.has(lead.status) || quotedLeadIds.has(lead.id))
        .length,
    },
    { step: "booked", count: leads.filter((lead) => lead.status === "booked").length },
  ];
}

export type VisaCases = {
  total: number;
  byStage: Array<{ stage: VisaStage; count: number }>;
  byCountry: Array<{ country: string; count: number; approved: number; rejected: number }>;
};

/** Visa applications of the period by stage and by country with their outcomes (issue 244). */
export function visaCases(
  leads: Array<{ payload: unknown; progress: unknown; status: string }>,
  countries: Map<string, unknown>,
): VisaCases {
  const stages = new Map<VisaStage, number>();
  const byCountry = new Map<string, { count: number; approved: number; rejected: number }>();
  for (const lead of leads) {
    const payload = lead.payload as {
      countrySlug?: unknown;
      countryName?: unknown;
      visaType?: unknown;
    };
    const slug = typeof payload?.countrySlug === "string" ? payload.countrySlug : "";
    const country = countries.get(slug);
    const { stage } = visaStage(
      visaFacts(checklistOf(country, payload?.visaType), progressOf(lead.progress), lead.status),
    );
    stages.set(stage, (stages.get(stage) ?? 0) + 1);
    const name =
      (country as { name?: unknown } | undefined)?.name ??
      (typeof payload?.countryName === "string" ? payload.countryName : slug || "—");
    const row = byCountry.get(String(name)) ?? { count: 0, approved: 0, rejected: 0 };
    row.count += 1;
    if (stage === "approved") row.approved += 1;
    if (stage === "rejected") row.rejected += 1;
    byCountry.set(String(name), row);
  }
  return {
    total: leads.length,
    byStage: [...stages.entries()]
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count),
    byCountry: [...byCountry.entries()]
      .map(([country, row]) => ({ country, ...row }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  };
}
