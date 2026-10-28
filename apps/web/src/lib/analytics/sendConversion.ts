import type { ConversionEvent, TrackParams } from "./track";

/** Meta's standard events where one fits; the rest go as custom events. */
const META_EVENT: Partial<Record<ConversionEvent, string>> = {
  search: "Search",
  lead_submit: "Lead",
  order_placed: "Purchase",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  sign_up: "CompleteRegistration",
  whatsapp_click: "Contact",
  call_click: "Contact",
};

export type AnalyticsWindow = {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

/**
 * One conversion to every tool the site loaded after consent (issue 237): a Tag Manager `dataLayer` event, a GA4
 * event and a Meta Pixel event. Amounts go as `value` in BDT. A tool that is not loaded is skipped.
 */
export function sendConversion(
  target: AnalyticsWindow,
  name: ConversionEvent,
  params: TrackParams,
): void {
  const money = typeof params.value === "number" ? { currency: "BDT" } : {};
  target.dataLayer?.push({ event: name, ...money, ...params });
  target.gtag?.("event", name, { ...money, ...params, transport_type: "beacon" });
  const meta = META_EVENT[name];
  if (meta) target.fbq?.("track", meta, { ...money, ...params });
  else target.fbq?.("trackCustom", name, params);
}

/** A tap on a call or WhatsApp link is a conversion; any other link is not. */
export function linkConversion(href: string): "call_click" | "whatsapp_click" | null {
  if (href.startsWith("tel:")) return "call_click";
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return "whatsapp_click";
  return null;
}

/** The key that keeps a lead, order or proof from being counted twice; null for events without a reference. */
export function onceKey(name: ConversionEvent, params: TrackParams): string | null {
  return params.reference ? `${name}:${String(params.reference)}` : null;
}
