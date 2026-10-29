import { describe, expect, it } from "vitest";
import type { ProviderContext } from "../providers/adapters";
import type { Fetcher } from "../providers/catalogAdapters";
import { smsAdapter, SmsError, smsNumber } from "./smsGateways";

type Call = { url: string; init: RequestInit };

function fake(answer: { status: number; body?: unknown }) {
  const calls: Call[] = [];
  const fetcher: Fetcher = (url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ status: answer.status, json: async () => answer.body ?? null });
  };
  return { calls, fetcher };
}

const ctx = (
  settings: Record<string, string>,
  secrets: Record<string, string>,
): ProviderContext => ({
  environment: "production",
  settings,
  secrets,
});

const bulk = ctx(
  { baseUrl: "https://bulksmsbd.net/", senderId: "8809601000000" },
  { apiKey: "key-123" },
);
const ssl = ctx(
  { baseUrl: "https://smsplus.sslwireless.com", sid: "WAAFA" },
  { apiToken: "tok-123" },
);
const twilio = ctx(
  { baseUrl: "https://api.twilio.com", accountSid: "AC123", from: "+14155550100" },
  { authToken: "auth-123" },
);

describe("phone numbers for gateways (issue 252)", () => {
  it.each([
    ["01712-345678", false, "8801712345678"],
    ["+880 1712 345678", false, "8801712345678"],
    ["01712345678", true, "+8801712345678"],
    ["12", false, null],
    ["<b>", false, null],
  ])("%s → %s", (phone, plus, expected) => {
    expect(smsNumber(phone, plus)).toBe(expected);
  });
});

describe("SMS gateway contracts (issue 252)", () => {
  it("BulkSMSBD: form post to /api/smsapi with the key, sender ID and 880 number; 202 is sent", async () => {
    const { calls, fetcher } = fake({ status: 200, body: { response_code: 202 } });
    await smsAdapter("bulksmsbd", fetcher).send("01712-345678", "WAAFA: hello", bulk);
    expect(calls[0]?.url).toBe("https://bulksmsbd.net/api/smsapi");
    expect(calls[0]?.init.method).toBe("POST");
    expect(Object.fromEntries(new URLSearchParams(String(calls[0]?.init.body)))).toEqual({
      api_key: "key-123",
      type: "text",
      number: "8801712345678",
      senderid: "8809601000000",
      message: "WAAFA: hello",
    });
  });

  it.each([
    [1002, "Sender ID"],
    [1007, "balance"],
    [1011, "API key"],
    [1032, "server IP"],
  ])("BulkSMSBD code %s says what is wrong (%s)", async (code, words) => {
    const { fetcher } = fake({ status: 200, body: { response_code: code } });
    const send = smsAdapter("bulksmsbd", fetcher).send("01712345678", "x", bulk);
    await expect(send).rejects.toBeInstanceOf(SmsError);
    await expect(send).rejects.toThrow(words);
  });

  it("BulkSMSBD health check reads the balance", async () => {
    const { calls, fetcher } = fake({ status: 200, body: { response_code: 202, balance: 99.5 } });
    const health = await smsAdapter("bulksmsbd", fetcher).healthCheck(bulk);
    expect(health).toEqual({ ok: true, message: expect.stringContaining("99.50 taka") });
    expect(calls[0]?.url).toContain("/api/getBalanceApi?api_key=key-123");
  });

  it("SSL Wireless: JSON to /api/v3/send-sms; SUCCESS is sent, a refusal is one sentence", async () => {
    const ok = fake({ status: 200, body: { status: "SUCCESS", status_code: 200 } });
    await smsAdapter("ssl-wireless", ok.fetcher).send("01712345678", "WAAFA: hi", ssl);
    expect(ok.calls[0]?.url).toBe("https://smsplus.sslwireless.com/api/v3/send-sms");
    expect(JSON.parse(String(ok.calls[0]?.init.body))).toMatchObject({
      api_token: "tok-123",
      sid: "WAAFA",
      msisdn: "8801712345678",
      sms: "WAAFA: hi",
      csms_id: expect.stringMatching(/^W[a-z0-9]+$/),
    });
    const no = fake({
      status: 200,
      body: { status: "FAILED", error_message: "Invalid api token" },
    });
    await expect(
      smsAdapter("ssl-wireless", no.fetcher).send("01712345678", "x", ssl),
    ).rejects.toThrow("SSL Wireless does not accept this API token.");
  });

  it("Twilio: basic auth form post with the +880 number; 401 is one sentence", async () => {
    const ok = fake({ status: 201, body: { sid: "SM1" } });
    await smsAdapter("twilio", ok.fetcher).send("01712345678", "WAAFA: hi", twilio);
    expect(ok.calls[0]?.url).toBe("https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json");
    expect((ok.calls[0]?.init.headers as Record<string, string>).authorization).toBe(
      `Basic ${Buffer.from("AC123:auth-123").toString("base64")}`,
    );
    expect(Object.fromEntries(new URLSearchParams(String(ok.calls[0]?.init.body)))).toEqual({
      To: "+8801712345678",
      From: "+14155550100",
      Body: "WAAFA: hi",
    });
    const no = fake({ status: 401 });
    await expect(smsAdapter("twilio", no.fetcher).send("01712345678", "x", twilio)).rejects.toThrow(
      "Twilio does not accept this Account SID and Auth token.",
    );
  });

  it("missing values and a gateway that does not answer are plain sentences", async () => {
    const down: Fetcher = () => Promise.reject(new Error("ECONNREFUSED"));
    await expect(smsAdapter("bulksmsbd", down).send("01712345678", "x", bulk)).rejects.toThrow(
      "BulkSMSBD did not answer",
    );
    const empty = await smsAdapter("bulksmsbd", down).healthCheck(ctx({}, {}));
    expect(empty).toEqual({ ok: false, message: expect.stringContaining("Fill in") });
  });
});
