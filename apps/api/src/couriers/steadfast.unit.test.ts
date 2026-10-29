import { describe, expect, it } from "vitest";
import type { ProviderContext } from "../providers/adapters";
import type { Fetcher } from "../providers/catalogAdapters";
import { localPhone, parcelState, steadfast } from "./steadfast";

const context: ProviderContext = {
  environment: "production",
  settings: { baseUrl: "https://portal.packzy.com/api/v1/", apiKey: "sf-key" },
  secrets: { secretKey: "sf-secret" },
};

function fake(status: number, body: unknown) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetcher: Fetcher = (url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ status, json: async () => body });
  };
  return { calls, fetcher };
}

describe("Steadfast contract (issue 253)", () => {
  it("books with the keys in headers, the local phone and the cash to collect", async () => {
    const { calls, fetcher } = fake(200, {
      status: 200,
      consignment: { consignment_id: 7, tracking_code: "SFX1", status: "in_review" },
    });
    const parcel = await steadfast(fetcher).book(
      {
        invoice: "ORD-261104-0007",
        name: "Rahim",
        phone: "+8801712345678",
        address: "Road 2, Dhaka",
        cod: 1250.4,
      },
      context,
    );
    expect(parcel).toEqual({ consignmentId: "7", trackingCode: "SFX1", status: "in_review" });
    expect(calls[0]?.url).toBe("https://portal.packzy.com/api/v1/create_order");
    expect(calls[0]?.init.headers).toMatchObject({
      "Api-Key": "sf-key",
      "Secret-Key": "sf-secret",
    });
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      invoice: "ORD-261104-0007",
      recipient_name: "Rahim",
      recipient_phone: "01712345678",
      recipient_address: "Road 2, Dhaka",
      cod_amount: 1250,
      note: "",
    });
  });

  it("turns Steadfast's validation errors and wrong keys into one sentence", async () => {
    const invalid = fake(200, {
      status: 400,
      errors: { invoice: ["The invoice has already been taken."] },
    });
    await expect(
      steadfast(invalid.fetcher).book(
        { invoice: "ORD-1", name: "R", phone: "+8801712345678", address: "A", cod: 0 },
        context,
      ),
    ).rejects.toThrow("Steadfast said: The invoice has already been taken.");
    const wrong = fake(401, { message: "Unauthorized" });
    expect(await steadfast(wrong.fetcher).healthCheck(context)).toEqual({
      ok: false,
      message: "Steadfast does not accept this API key and Secret key.",
    });
  });

  it("refuses a phone outside Bangladesh before calling", async () => {
    const { calls, fetcher } = fake(200, {});
    await expect(
      steadfast(fetcher).book(
        { invoice: "ORD-1", name: "R", phone: "+14155550100", address: "A", cod: 0 },
        context,
      ),
    ).rejects.toThrow("Bangladeshi mobile numbers");
    expect(calls).toEqual([]);
  });

  it.each([
    ["+8801712345678", "01712345678"],
    ["01712-345678", "01712345678"],
    ["+14155550100", null],
  ])("local phone %s → %s", (phone, expected) => {
    expect(localPhone(phone)).toBe(expected);
  });

  it("reads statuses in plain words; only delivered and cancelled are final", () => {
    expect(parcelState("delivered")).toMatchObject({ final: "delivered" });
    expect(parcelState("cancelled")).toMatchObject({ final: "cancelled" });
    expect(parcelState("hold")).toEqual({ status: "hold", words: "On hold at the courier" });
    expect(parcelState("delivered_approval_pending").final).toBeUndefined();
    expect(parcelState("new_status").words).toBe("Courier status: new status");
  });
});
