import { describe, expect, it, vi } from "vitest";
import { linkConversion, onceKey, sendConversion, type AnalyticsWindow } from "./sendConversion";

describe("sendConversion (issue 237)", () => {
  it("sends one event to Tag Manager, GA4 and the Meta Pixel with the amount in taka", () => {
    const target: AnalyticsWindow = { dataLayer: [], gtag: vi.fn(), fbq: vi.fn() };
    sendConversion(target, "order_placed", { reference: "WS-1001", value: 146480 });
    expect(target.dataLayer).toEqual([
      { event: "order_placed", currency: "BDT", reference: "WS-1001", value: 146480 },
    ]);
    expect(target.gtag).toHaveBeenCalledOnce();
    expect(target.gtag).toHaveBeenCalledWith("event", "order_placed", {
      currency: "BDT",
      reference: "WS-1001",
      value: 146480,
      transport_type: "beacon",
    });
    expect(target.fbq).toHaveBeenCalledWith("track", "Purchase", {
      currency: "BDT",
      reference: "WS-1001",
      value: 146480,
    });
  });

  it("uses custom Pixel events where Meta has no standard one, and skips tools that are not loaded", () => {
    const fbq = vi.fn();
    sendConversion({ fbq }, "payment_proof_sent", { reference: "WS-1001" });
    expect(fbq).toHaveBeenCalledWith("trackCustom", "payment_proof_sent", { reference: "WS-1001" });
    expect(() => sendConversion({}, "search", { module: "flights" })).not.toThrow();
  });

  it("counts call and WhatsApp taps, and a reference only once", () => {
    expect(linkConversion("tel:+8809613000000")).toBe("call_click");
    expect(linkConversion("https://wa.me/8801700000000?text=Hi")).toBe("whatsapp_click");
    expect(linkConversion("https://api.whatsapp.com/send?phone=880")).toBe("whatsapp_click");
    expect(linkConversion("/contact")).toBeNull();
    expect(onceKey("lead_submit", { reference: "WT-1001" })).toBe("lead_submit:WT-1001");
    expect(onceKey("search", { module: "flights" })).toBeNull();
  });
});
