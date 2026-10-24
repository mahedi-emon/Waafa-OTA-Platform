import { LeadModuleSchema, LeadStatusSchema, OrderStatusSchema } from "@waafa/shared";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import { pageParam } from "./format";

/*
 * The inbox queues' address state (D0 R6): the list page and the work item read the same parameters, so the queue
 * beside a lead or an order is the list the person came from, and Back returns to it as they left it.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** closed: lost and cancelled, the board's last column ("N more in the list" lands here). */
export const LEAD_VIEWS = ["all", "open", "mine", "unassigned", "overdue", "closed"] as const;
export const VISA_VIEWS = ["all", "open", "mine", "unassigned"] as const;
export const VISA_STAGES = [
  "documentsPending",
  "readyToSubmit",
  "submitted",
  "approved",
  "rejected",
  "passportReturned",
  "cancelled",
] as const;
const CREATED_SORTS = ["created.asc", "created.desc"] as const;
const ORDER_SORTS = ["created.asc", "created.desc", "total.asc", "total.desc"] as const;

/** The leads list's query (LeadListQuerySchema), kept to values the API accepts. */
export function leadListQuery(params: SearchParams) {
  return {
    view: LEAD_VIEWS.find((item) => item === one(params.view)) ?? "all",
    module: LeadModuleSchema.safeParse(one(params.module)).data,
    status: LeadStatusSchema.safeParse(one(params.status)).data,
    q: one(params.q)?.trim().slice(0, 80) || undefined,
    sort: sortOf(params.sort, CREATED_SORTS),
    page: pageParam(params.page),
    pageSize: pageSizeOf(params.pageSize),
  };
}

/** The visa applications list's query (VisaApplicationListQuerySchema). */
export function visaListQuery(params: SearchParams) {
  return {
    view: VISA_VIEWS.find((item) => item === one(params.view)) ?? "all",
    stage: VISA_STAGES.find((item) => item === one(params.stage)),
    q: one(params.q)?.trim().slice(0, 80) || undefined,
    sort: sortOf(params.sort, CREATED_SORTS),
    page: pageParam(params.page),
    pageSize: pageSizeOf(params.pageSize),
  };
}

/** The orders list's query (OrderListQuerySchema). */
export function orderListQuery(params: SearchParams) {
  return {
    status: OrderStatusSchema.safeParse(one(params.status)).data,
    q: one(params.q)?.trim().slice(0, 80) || undefined,
    sort: sortOf(params.sort, ORDER_SORTS),
    page: pageParam(params.page),
    pageSize: pageSizeOf(params.pageSize),
  };
}

/** The address parameters that differ from the list's defaults (view all, page 1, 25 rows), for links. */
export function queueSearch(query: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    if (key === "view" && value === "all") continue;
    if (key === "page" && value === 1) continue;
    if (key === "pageSize" && value === 25) continue;
    search.set(key, String(value));
  }
  return search.toString();
}

/** A path with a search string, or the bare path. */
export const withSearch = (path: string, search: string) => (search ? `${path}?${search}` : path);
