import {
  formatDate,
  formatTime,
  type IntegrationSettingView,
  type ProviderConnectionView,
} from "@waafa/shared";

export type CardStatusKind = "off" | "notConnected" | "notTested" | "connected" | "failing";

export type CardStatus =
  { kind: Exclude<CardStatusKind, "failing"> } | { kind: "failing"; message: string; at: string };

/** Chip colours: text always says the state, colour only repeats it. */
export const STATUS_VARIANT = {
  off: "neutral",
  notConnected: "neutral",
  notTested: "warning",
  connected: "success",
  failing: "danger",
} as const satisfies Record<CardStatusKind, string>;

/** "12 Oct 2026, 10:05" in Asia/Dhaka. */
export function whenText(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/**
 * One card's state (issue 284): Off until turned on; then Not connected (no values for the set in use), Not tested,
 * Connected (last test passed) or Failing with the last error and when it happened.
 */
export function cardStatus(
  setting: Pick<IntegrationSettingView, "isActive">,
  connection: Pick<ProviderConnectionView, "health"> | undefined,
): CardStatus {
  if (!setting.isActive) return { kind: "off" };
  if (!connection) return { kind: "notConnected" };
  if (!connection.health) return { kind: "notTested" };
  if (connection.health.ok) return { kind: "connected" };
  return {
    kind: "failing",
    message: connection.health.message,
    at: whenText(connection.health.at),
  };
}
