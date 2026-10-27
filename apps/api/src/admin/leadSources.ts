/** Where a lead or order came from, as stored in `source` (LeadSourceSchema; issue 237). */
type StoredSource = {
  channel?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  referrer?: string;
} | null;

/** Well-known sites under one plain name (any country domain, mobile or link-shim host). */
const SITES: Array<[RegExp, string]> = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, "X"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "ChatGPT"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
];

const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * One row label for "Where leads come from": the UTM source (with its medium), else the site the visitor came from,
 * else how staff took it (phone, WhatsApp, walk-in), else "Direct or unknown".
 */
export function sourceLabel(source: StoredSource): { source: string; campaign: string | null } {
  const campaign = source?.utm?.campaign?.trim() || null;
  const utm = source?.utm?.source?.trim();
  if (utm) {
    const medium = source?.utm?.medium?.trim();
    return { source: medium ? `${title(utm)} (${medium})` : title(utm), campaign };
  }
  const host = source?.referrer?.split("/")[0]?.toLowerCase();
  if (host) {
    const known = SITES.find(([pattern]) => pattern.test(host));
    return { source: known ? known[1] : host.replace(/^www\./, ""), campaign };
  }
  if (source?.channel && source.channel !== "web") {
    return { source: title(source.channel.replace("-", " ")), campaign };
  }
  return { source: "Direct or unknown", campaign };
}

export type SourceRow = {
  source: string;
  campaign: string | null;
  leads: number;
  booked: number;
  orders: number;
  revenue: number;
};

/** Leads (with how many were booked) and sold orders (with revenue) per source and campaign, most leads first. */
export function groupBySource(
  leads: Array<{ source: unknown; status: string }>,
  orders: Array<{ source: unknown; total: number }>,
): SourceRow[] {
  const rows = new Map<string, SourceRow>();
  const row = (stored: unknown) => {
    const label = sourceLabel(stored as StoredSource);
    const key = `${label.source}\u0000${label.campaign ?? ""}`;
    let entry = rows.get(key);
    if (!entry) {
      entry = { ...label, leads: 0, booked: 0, orders: 0, revenue: 0 };
      rows.set(key, entry);
    }
    return entry;
  };
  for (const lead of leads) {
    const entry = row(lead.source);
    entry.leads += 1;
    if (lead.status === "booked") entry.booked += 1;
  }
  for (const order of orders) {
    const entry = row(order.source);
    entry.orders += 1;
    entry.revenue += order.total;
  }
  return [...rows.values()].sort(
    (a, b) => b.leads - a.leads || b.orders - a.orders || a.source.localeCompare(b.source),
  );
}
