/** The conversions the owner measures (issue 237), named as GA4 recommends where it has a name. */
export type ConversionEvent =
  | "search"
  | "lead_submit"
  | "order_placed"
  | "payment_proof_sent"
  | "whatsapp_click"
  | "call_click"
  | "sign_up"
  | "login"
  | "add_to_cart"
  | "begin_checkout";

export type TrackParams = Record<string, string | number>;

export const TRACK_EVENT = "waafa:track";

/**
 * Reports a conversion. It only announces it in the page: the analytics bridge, which loads after the visitor accepts
 * cookies, sends it to GA4, Tag Manager and the Meta Pixel. Without consent nothing listens and nothing is sent.
 */
export function track(name: ConversionEvent, params: TrackParams = {}): void {
  window.dispatchEvent(new CustomEvent(TRACK_EVENT, { detail: { name, params } }));
}
