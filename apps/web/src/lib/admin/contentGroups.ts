import { CONTENT_MODEL, type ContentKey } from "@waafa/shared";

/** The content areas the editor lists; "payments" gathers the money and delivery settings in one place. */
export const CONTENT_GROUPS = [
  "settings",
  "payments",
  "home",
  "content",
  "travel",
  "visa",
  "shop",
] as const;
export type ContentGroupKey = (typeof CONTENT_GROUPS)[number];

const PAYMENTS: ContentKey[] = ["paymentSettings", "shippingSettings", "emiSettings", "emiBanks"];

export function keysInGroup(group: ContentGroupKey, visible: readonly string[]): ContentKey[] {
  const keys = (Object.keys(CONTENT_MODEL) as ContentKey[]).filter((key) => visible.includes(key));
  if (group === "payments") return PAYMENTS.filter((key) => keys.includes(key));
  return keys.filter((key) => CONTENT_MODEL[key].group === group);
}
