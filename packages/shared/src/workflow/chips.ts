import { contentChip } from "./content";
import { couponStatus, groupFareStatus, productStockStatus, windowStatus } from "./derived";

/** Every chip a list row can show (ADMIN.md §8): nobody picks these, they follow from status, dates and numbers. */
export type RecordChipName =
  | "draft"
  | "scheduled"
  | "live"
  | "expired"
  | "archived"
  | "off"
  | "ended"
  | "active"
  | "usedUp"
  | "open"
  | "fewSeats"
  | "soldOut"
  | "inStock"
  | "lowStock"
  | "outOfStock"
  | "shown"
  | "hidden";

/** A chip and what its tooltip names: a date (`at` it happens or happened, `until` it ends) or a number. */
export type RecordChip = { name: RecordChipName; at?: string; until?: string; count?: number };

type Data = Record<string, unknown>;

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value ? value : undefined;
const num = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const dated = (name: RecordChipName, key: "at" | "until", value: unknown): RecordChip => {
  const date = text(value);
  return date ? { name, [key]: date } : { name };
};

/** Draft, Scheduled, Live, Expired or Archived from a record's status and dates. */
function workflowChip(data: Data, now: Date): RecordChip {
  const chip = contentChip(
    {
      status: text(data.status),
      publishAt: text(data.publishAt),
      liveSince: text(data.liveSince),
    },
    now,
  );
  switch (chip.state) {
    case "scheduled":
      return { name: "scheduled", at: chip.at };
    case "expired":
      return { name: "expired", at: chip.at };
    case "live":
      return chip.since ? { name: "live", at: chip.since } : { name: "live" };
    default:
      return { name: chip.state };
  }
}

/** Scheduled, Live or Ended inside a start and end, Off when switched off. */
function windowChip(data: Data, now: Date): RecordChip {
  if (data.enabled === false) return { name: "off" };
  const state = windowStatus({ startsAt: text(data.startsAt), endsAt: text(data.endsAt) }, now);
  if (state === "scheduled") return dated("scheduled", "at", data.startsAt);
  if (state === "ended") return dated("ended", "at", data.endsAt);
  return dated("live", "until", data.endsAt);
}

/**
 * The chips a record shows in its list, in order: its workflow or window state first, then what its numbers say
 * (stock for products). `uses` is how many orders used a coupon.
 */
export function recordChipsOf(
  key: string,
  record: unknown,
  now: Date,
  facts: { uses?: number } = {},
): RecordChip[] {
  const data = (record && typeof record === "object" ? record : {}) as Data;
  switch (key) {
    case "banners":
    case "announcements":
      return [windowChip(data, now)];
    case "deals":
      return [windowChip({ endsAt: data.endsAt }, now)];
    case "coupons": {
      const state = couponStatus(
        {
          enabled: data.enabled !== false,
          startsAt: text(data.startsAt) ?? "",
          endsAt: text(data.endsAt),
          maxUses: num(data.maxUses),
        },
        facts.uses ?? 0,
        now,
      );
      if (state === "scheduled") return [dated("scheduled", "at", data.startsAt)];
      if (state === "expired") return [dated("expired", "at", data.endsAt)];
      if (state === "usedUp") return [{ name: "usedUp", count: facts.uses ?? 0 }];
      if (state === "off") return [{ name: "off" }];
      return [dated("active", "until", data.endsAt)];
    }
    case "groupFares": {
      const seats = num(data.seatsLeft);
      const state = groupFareStatus(
        {
          ...(seats !== undefined ? { seatsLeft: seats } : {}),
          expiresAt: text(data.expiresAt) ?? "",
          departDate: text(data.departDate) ?? "",
        },
        now,
      );
      if (state === "expired") return [dated("expired", "at", data.expiresAt)];
      if (state === "soldOut") return [{ name: "soldOut" }];
      if (state === "fewSeats") return [{ name: "fewSeats", count: seats ?? 0 }];
      return [dated("open", "until", data.expiresAt)];
    }
    case "products": {
      const variants = Array.isArray(data.variants)
        ? (data.variants as Array<{ stock?: unknown; lowStockAt?: unknown; preOrder?: unknown }>)
        : [];
      const stock = productStockStatus(
        variants.map((variant) => ({
          stock: num(variant.stock) ?? 0,
          lowStockAt: num(variant.lowStockAt) ?? 3,
          preOrder: variant.preOrder === true,
        })),
      );
      return [workflowChip(data, now), { name: stock }];
    }
    default:
      if (
        typeof data.status === "string" &&
        ["draft", "scheduled", "published", "archived"].includes(data.status)
      )
        return [workflowChip(data, now)];
      if (typeof data.visible === "boolean") return [{ name: data.visible ? "shown" : "hidden" }];
      if (typeof data.enabled === "boolean") return [{ name: data.enabled ? "shown" : "hidden" }];
      return [];
  }
}
