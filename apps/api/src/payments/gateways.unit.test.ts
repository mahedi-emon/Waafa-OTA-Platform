import {
  constants,
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt,
  type KeyExportOptions,
  type KeyObject,
} from "node:crypto";
import { providerDefinition } from "@waafa/shared";
import { describe, expect, it } from "vitest";
import type { ProviderContext } from "../providers/adapters";
import type { Fetcher } from "../providers/catalogAdapters";
import { bkash, nagad, referenceOf, sessionId, sslcommerz } from "./gateways";

type Call = { url: string; init: RequestInit };

/** A fake gateway: answers each call by the path it asks for, and remembers the calls. */
function gateway(answers: Record<string, unknown | ((call: Call) => unknown)>) {
  const calls: Call[] = [];
  const fetcher: Fetcher = async (url, init) => {
    calls.push({ url, init });
    const key = Object.keys(answers).find((path) => url.includes(path));
    const answer = key ? answers[key] : { status: "NOT_FOUND" };
    const body =
      typeof answer === "function" ? (answer as (call: Call) => unknown)({ url, init }) : answer;
    return { status: 200, json: async () => body };
  };
  return { fetcher, calls };
}

const input = {
  reference: sessionId("ORD-261104-0007", 1),
  amount: 146480,
  customer: { name: "Sample Rahim", phone: "+8801712345678" },
  successUrl: "https://waafasworld.com/api/payments/x/success",
  failUrl: "https://waafasworld.com/api/payments/x/fail",
  cancelUrl: "https://waafasworld.com/api/payments/x/cancel",
};

describe("payment sessions (issue 251)", () => {
  it("names the order and the attempt", () => {
    expect(sessionId("ORD-261104-0007", 2)).toBe("ORD-261104-0007_2");
    expect(referenceOf("ORD-261104-0007_2")).toBe("ORD-261104-0007");
  });
});

describe("SSLCommerz (issue 251)", () => {
  const context: ProviderContext = {
    environment: "sandbox",
    settings: { baseUrl: "https://sandbox.sslcommerz.com", storeId: "waafa01" },
    secrets: { storePassword: "pass@ssl" },
  };
  const definition = providerDefinition("sslcommerz")!;

  it("opens a session for the server's amount and returns the gateway page", async () => {
    const { fetcher, calls } = gateway({
      "/gwprocess/v4/api.php": {
        status: "SUCCESS",
        GatewayPageURL: "https://sandbox.sslcommerz.com/pay/abc",
        sessionkey: "abc",
      },
    });
    const session = await sslcommerz(definition, fetcher).initiate(input, context);
    expect(session).toEqual({
      sessionId: "abc",
      redirectUrl: "https://sandbox.sslcommerz.com/pay/abc",
    });
    const form = new URLSearchParams(String(calls[0]!.init.body));
    expect(form.get("total_amount")).toBe("146480");
    expect(form.get("currency")).toBe("BDT");
    expect(form.get("tran_id")).toBe("ORD-261104-0007_1");
    expect(form.get("store_passwd")).toBe("pass@ssl");
  });

  it("believes a payment only after the validation API says VALID", async () => {
    const { fetcher, calls } = gateway({
      "/validator/api/validationserverAPI.php": {
        status: "VALID",
        tran_id: "ORD-261104-0007_1",
        currency_amount: "146480.00",
        currency_type: "BDT",
        bank_tran_id: "BANK123",
      },
    });
    const status = await sslcommerz(definition, fetcher).verifyCallback(
      // The posted amount is ignored: only the validation answer counts.
      { val_id: "v1", tran_id: "ORD-261104-0007_1", amount: "1" },
      context,
    );
    expect(status).toEqual({
      reference: "ORD-261104-0007",
      paid: true,
      amount: 146480,
      transactionId: "BANK123",
    });
    expect(calls[0]!.url).toContain("val_id=v1");
    const failed = gateway({ "/validator/": { status: "FAILED", tran_id: "ORD-261104-0007_1" } });
    expect(
      (await sslcommerz(definition, failed.fetcher).verifyCallback({ val_id: "v2" }, context)).paid,
    ).toBe(false);
  });

  it("says in one sentence what is wrong with the keys", async () => {
    const wrong = gateway({ "/validator/": { status: "INVALID_STORE" } });
    const health = await sslcommerz(definition, async (url, init) =>
      url.includes("validator") ? wrong.fetcher(url, init) : { status: 200 },
    ).healthCheck(context);
    expect(health.ok).toBe(false);
    expect(health.message).toMatch(/^SSLCommerz didn't accept the store ID or password/);
  });
});

describe("bKash (issue 251)", () => {
  const context: ProviderContext = {
    environment: "sandbox",
    settings: {
      baseUrl: "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
      appKey: "app",
      username: "user",
    },
    secrets: { appSecret: "secret", password: "pw" },
  };
  const definition = providerDefinition("bkash")!;

  it("grants a token, creates the payment and executes it on the callback", async () => {
    const { fetcher, calls } = gateway({
      "/token/grant": { id_token: "tok" },
      "/checkout/create": { paymentID: "P1", bkashURL: "https://sandbox.bka.sh/pay/P1" },
      "/checkout/execute": {
        transactionStatus: "Completed",
        amount: "146480",
        trxID: "TRX9",
        merchantInvoiceNumber: "ORD-261104-0007_1",
      },
    });
    const adapter = bkash(definition, fetcher);
    expect((await adapter.initiate(input, context)).redirectUrl).toBe(
      "https://sandbox.bka.sh/pay/P1",
    );
    const create = JSON.parse(String(calls[1]!.init.body)) as Record<string, string>;
    expect(create).toMatchObject({
      amount: "146480",
      currency: "BDT",
      merchantInvoiceNumber: "ORD-261104-0007_1",
    });
    expect((calls[1]!.init.headers as Record<string, string>).authorization).toBe("tok");
    const status = await adapter.verifyCallback({ paymentID: "P1", status: "success" }, context);
    expect(status).toEqual({
      reference: "ORD-261104-0007",
      paid: true,
      amount: 146480,
      transactionId: "TRX9",
    });
    expect(
      (await adapter.verifyCallback({ paymentID: "P1", status: "cancel" }, context)).paid,
    ).toBe(false);
  });

  it("tells staff the keys are wrong when bKash refuses the token", async () => {
    const { fetcher } = gateway({ "/token/grant": { statusMessage: "Invalid app key" } });
    const health = await bkash(definition, fetcher).healthCheck(context);
    expect(health).toEqual({
      ok: false,
      message:
        "bKash didn't accept the keys (Invalid app key): copy the app key, app secret, username and password again.",
    });
  });
});

describe("Nagad (issue 251)", () => {
  const merchant = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const nagadPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pemOf = (key: KeyObject, type: "spki" | "pkcs8") =>
    String(key.export({ type, format: "pem" } as KeyExportOptions<"pem">));
  const context: ProviderContext = {
    environment: "sandbox",
    settings: {
      baseUrl: "https://sandbox.mynagad.com:10080/remote-payment-gateway-1.0",
      merchantId: "683002007104225",
      pgPublicKey: pemOf(nagadPair.publicKey, "spki"),
    },
    secrets: { merchantPrivateKey: pemOf(merchant.privateKey, "pkcs8") },
  };
  const definition = providerDefinition("nagad")!;
  const forMerchant = (data: object) =>
    publicEncrypt(
      { key: merchant.publicKey, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(JSON.stringify(data)),
    ).toString("base64");
  const readByNagad = (sealed: string) =>
    JSON.parse(
      privateDecrypt(
        { key: nagadPair.privateKey, padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(sealed, "base64"),
      ).toString(),
    ) as Record<string, string>;

  it("seals the order for Nagad, completes it and verifies the callback", async () => {
    const { fetcher, calls } = gateway({
      "/check-out/initialize/": {
        sensitiveData: forMerchant({ paymentReferenceId: "REF1", challenge: "ch" }),
      },
      "/check-out/complete/REF1": { callBackUrl: "https://sandbox.mynagad.com/pay/REF1" },
      "/verify/payment/REF1": {
        status: "Success",
        amount: "146480",
        issuerPaymentRefNo: "NG77",
        additionalMerchantInfo: { reference: "ORD-261104-0007_1" },
      },
    });
    const adapter = nagad(definition, fetcher);
    expect((await adapter.initiate(input, context)).redirectUrl).toBe(
      "https://sandbox.mynagad.com/pay/REF1",
    );
    const complete = JSON.parse(String(calls[1]!.init.body)) as { sensitiveData: string };
    expect(readByNagad(complete.sensitiveData)).toMatchObject({
      amount: "146480",
      currencyCode: "050",
      challenge: "ch",
    });
    const status = await adapter.verifyCallback(
      { payment_ref_id: "REF1", status: "Success" },
      context,
    );
    expect(status).toEqual({
      reference: "ORD-261104-0007",
      paid: true,
      amount: 146480,
      transactionId: "NG77",
    });
  });

  it("explains unreadable keys in plain words", async () => {
    const health = await nagad(definition, gateway({}).fetcher).healthCheck({
      ...context,
      secrets: { merchantPrivateKey: "not a key" },
    });
    expect(health.ok).toBe(false);
    expect(health.message).toMatch(/^The Nagad keys can't be read/);
  });
});
