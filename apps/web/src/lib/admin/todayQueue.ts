import type { InboxCountKey } from "@waafa/shared";

const ADMIN = "/secure-admin-control";

/** One Today card: what waits, and the list that shows exactly those items. */
export type TodayCard = { key: InboxCountKey; count: number; href: string };

/** The Today queue in the order work is done (ADMIN.md §5.2). */
const QUEUE: ReadonlyArray<{ key: InboxCountKey; href: string }> = [
  { key: "newLeads", href: `${ADMIN}/leads?status=new` },
  { key: "overdueLeads", href: `${ADMIN}/leads?view=overdue` },
  { key: "visaWaiting", href: `${ADMIN}/visa-applications?view=open` },
  { key: "ordersToConfirm", href: `${ADMIN}/orders?status=placed` },
  { key: "proofsToVerify", href: `${ADMIN}/payments` },
  { key: "feedbackToReview", href: `${ADMIN}/feedback` },
  { key: "reviewsToModerate", href: `${ADMIN}/reviews` },
  { key: "lowStock", href: `${ADMIN}/content/products?chip=lowStock` },
  { key: "groupFaresEnding", href: `${ADMIN}/content/groupFares` },
  { key: "sampleLeft", href: `${ADMIN}/content` },
];

/** The cards this person gets: one per count the server sent for their roles, zero included (a calm tick). */
export function todayCards(counts: Partial<Record<InboxCountKey, number>>): TodayCard[] {
  return QUEUE.flatMap((card) =>
    typeof counts[card.key] === "number" ? [{ ...card, count: counts[card.key] ?? 0 }] : [],
  );
}

/** A week against the week before, for the words under a KPI ("+4 vs last week"). */
export function weekChange(
  thisWeek: number,
  lastWeek: number,
): { direction: "up" | "down" | "same"; by: number } {
  const by = thisWeek - lastWeek;
  return { direction: by > 0 ? "up" : by < 0 ? "down" : "same", by: Math.abs(by) };
}

/** Booked requests as a share of new ones over the same days, in whole percent (0 when there were none). */
export function conversionPercent(booked: number, leads: number): number {
  return leads > 0 ? Math.round((booked / leads) * 100) : 0;
}
