import {
  constants,
  createPrivateKey,
  createPublicKey,
  createSign,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from "node:crypto";
import type { OnlineGateway, ProviderDefinition } from "@waafa/shared";
import type {
  HealthResult,
  PaymentProvider,
  PaymentSession,
  PaymentStatus,
  ProviderContext,
} from "../providers/adapters";
import { checkConnection, type Fetcher } from "../providers/catalogAdapters";

/** What a gateway said, in one plain sentence for staff (Test connection) and logs. */
export class GatewayError extends Error {}

/** The order a gateway session belongs to: "ORD-261104-0007_2" is the order's second attempt. */
export const sessionId = (reference: string, attempt: number) => `${reference}_${attempt}`;
export const referenceOf = (session: string) => session.split("_")[0] ?? "";

const base = (context: ProviderContext) => (context.settings.baseUrl ?? "").replace(/\/+$/, "");
const timeout = (context: ProviderContext) => context.signal ?? AbortSignal.timeout(15_000);

async function json(
  fetcher: Fetcher,
  url: string,
  init: RequestInit,
  who: string,
): Promise<Record<string, unknown>> {
  let response: Awaited<ReturnType<Fetcher>>;
  try {
    response = await fetcher(url, init);
  } catch {
    throw new GatewayError(`${who} did not answer. Check the API base URL and try again.`);
  }
  const body = (await response.json?.().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object")
    throw new GatewayError(`${who} answered HTTP ${response.status} without the expected data.`);
  return body;
}

const amountOf = (value: unknown) => Math.round(Number(value ?? 0));
const text = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

/* ---------------------------------------- SSLCommerz ---------------------------------------- */

/**
 * SSLCommerz (v4 hosted checkout): a session for the order's amount, then the result is checked with the validation
 * API (val_id), never from the posted fields alone.
 */
export function sslcommerz(
  definition: ProviderDefinition,
  fetcher: Fetcher = fetch,
): PaymentProvider {
  const credentials = (context: ProviderContext) => ({
    store_id: context.settings.storeId ?? "",
    store_passwd: context.secrets.storePassword ?? "",
  });
  return {
    id: definition.id,
    kind: "payment",
    async healthCheck(context): Promise<HealthResult> {
      const reach = await checkConnection(definition, context, fetcher);
      if (!reach.ok) return reach;
      // The validation API answers a made-up val_id with INVALID_TRANSACTION when the store ID and password are right.
      const query = new URLSearchParams({
        val_id: "waafa-check",
        ...credentials(context),
        format: "json",
      });
      try {
        const body = await json(
          fetcher,
          `${base(context)}/validator/api/validationserverAPI.php?${query}`,
          { method: "GET", signal: timeout(context) },
          "SSLCommerz",
        );
        const status = text(body.status).toUpperCase();
        if (status === "INVALID_TRANSACTION")
          return { ok: true, message: "Saved; SSLCommerz accepts the store ID and password." };
        return {
          ok: false,
          message:
            "SSLCommerz didn't accept the store ID or password: copy both again from the SSLCommerz panel.",
        };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
    async initiate(input, context): Promise<PaymentSession> {
      const form = new URLSearchParams({
        ...credentials(context),
        total_amount: String(input.amount),
        currency: "BDT",
        tran_id: input.reference,
        success_url: input.successUrl,
        fail_url: input.failUrl,
        cancel_url: input.cancelUrl,
        ipn_url: context.settings.ipnUrl ?? input.successUrl,
        cus_name: input.customer.name,
        cus_email: input.customer.email ?? "noreply@waafasworld.com",
        cus_phone: input.customer.phone,
        cus_add1: "Bangladesh",
        cus_city: "Dhaka",
        cus_country: "Bangladesh",
        shipping_method: "NO",
        product_name: `Order ${referenceOf(input.reference)}`,
        product_category: "Waafa's World",
        product_profile: "general",
      });
      const body = await json(
        fetcher,
        `${base(context)}/gwprocess/v4/api.php`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: form.toString(),
          signal: timeout(context),
        },
        "SSLCommerz",
      );
      const url = text(body.GatewayPageURL);
      if (text(body.status).toUpperCase() !== "SUCCESS" || !url)
        throw new GatewayError(
          `SSLCommerz refused the payment: ${text(body.failedreason) || "no reason given"}.`,
        );
      return { sessionId: text(body.sessionkey) || input.reference, redirectUrl: url };
    },
    async verifyCallback(payload, context): Promise<PaymentStatus> {
      const valId = payload.val_id ?? "";
      const reference = referenceOf(payload.tran_id ?? "");
      if (!valId) return { reference, paid: false, amount: 0, transactionId: null };
      const query = new URLSearchParams({ val_id: valId, ...credentials(context), format: "json" });
      const body = await json(
        fetcher,
        `${base(context)}/validator/api/validationserverAPI.php?${query}`,
        { method: "GET", signal: timeout(context) },
        "SSLCommerz",
      );
      const status = text(body.status).toUpperCase();
      return {
        reference: referenceOf(text(body.tran_id)) || reference,
        paid:
          (status === "VALID" || status === "VALIDATED") &&
          text(body.currency_type || "BDT") === "BDT",
        amount: amountOf(body.currency_amount ?? body.amount),
        transactionId: text(body.bank_tran_id) || text(body.val_id) || null,
      };
    },
    refund: () =>
      Promise.reject(
        new GatewayError("Refund in the SSLCommerz panel, then record it on the order."),
      ),
    query: () =>
      Promise.reject(new GatewayError("SSLCommerz payments are checked with the validation API.")),
  };
}

/* ------------------------------------------- bKash ------------------------------------------- */

/** bKash tokenized checkout: grant a token, create the payment, then execute it when bKash calls back. */
export function bkash(definition: ProviderDefinition, fetcher: Fetcher = fetch): PaymentProvider {
  async function grant(context: ProviderContext): Promise<string> {
    const body = await json(
      fetcher,
      `${base(context)}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          username: context.settings.username ?? "",
          password: context.secrets.password ?? "",
        },
        body: JSON.stringify({
          app_key: context.settings.appKey ?? "",
          app_secret: context.secrets.appSecret ?? "",
        }),
        signal: timeout(context),
      },
      "bKash",
    );
    const token = text(body.id_token);
    if (!token)
      throw new GatewayError(
        `bKash didn't accept the keys (${text(body.statusMessage || body.msg) || "no reason given"}): copy the app key, app secret, username and password again.`,
      );
    return token;
  }
  const headers = (context: ProviderContext, token: string) => ({
    "content-type": "application/json",
    accept: "application/json",
    authorization: token,
    "x-app-key": context.settings.appKey ?? "",
  });
  return {
    id: definition.id,
    kind: "payment",
    async healthCheck(context): Promise<HealthResult> {
      try {
        await grant(context);
        return { ok: true, message: "Saved; bKash accepts the keys." };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
    async initiate(input, context): Promise<PaymentSession> {
      const token = await grant(context);
      const body = await json(
        fetcher,
        `${base(context)}/tokenized/checkout/create`,
        {
          method: "POST",
          headers: headers(context, token),
          body: JSON.stringify({
            mode: "0011",
            payerReference: input.customer.phone,
            callbackURL: input.successUrl,
            amount: String(input.amount),
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: input.reference,
          }),
          signal: timeout(context),
        },
        "bKash",
      );
      const url = text(body.bkashURL);
      if (!url)
        throw new GatewayError(
          `bKash refused the payment: ${text(body.statusMessage) || "no reason given"}.`,
        );
      return { sessionId: text(body.paymentID), redirectUrl: url };
    },
    async verifyCallback(payload, context): Promise<PaymentStatus> {
      const paymentId = payload.paymentID ?? "";
      if (!paymentId || (payload.status ?? "").toLowerCase() !== "success")
        return { reference: "", paid: false, amount: 0, transactionId: null };
      const token = await grant(context);
      let body = await json(
        fetcher,
        `${base(context)}/tokenized/checkout/execute`,
        {
          method: "POST",
          headers: headers(context, token),
          body: JSON.stringify({ paymentID: paymentId }),
          signal: timeout(context),
        },
        "bKash",
      );
      // A repeated callback finds the payment already executed: ask bKash for its status instead.
      if (!body.transactionStatus) {
        body = await json(
          fetcher,
          `${base(context)}/tokenized/checkout/payment/status`,
          {
            method: "POST",
            headers: headers(context, token),
            body: JSON.stringify({ paymentID: paymentId }),
            signal: timeout(context),
          },
          "bKash",
        );
      }
      return {
        reference: referenceOf(text(body.merchantInvoiceNumber)),
        paid: text(body.transactionStatus) === "Completed",
        amount: amountOf(body.amount),
        transactionId: text(body.trxID) || null,
      };
    },
    refund: () =>
      Promise.reject(
        new GatewayError("Refund in the bKash merchant panel, then record it on the order."),
      ),
    query: () =>
      Promise.reject(new GatewayError("bKash payments are checked when bKash calls back.")),
  };
}

/* ------------------------------------------- Nagad ------------------------------------------- */

const pem = (key: string, kind: "PUBLIC" | "PRIVATE") => {
  const body = key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return `-----BEGIN ${kind} KEY-----\n${body.match(/.{1,64}/g)?.join("\n") ?? ""}\n-----END ${kind} KEY-----`;
};

/** Nagad's checkout: data is encrypted with Nagad's public key and signed with the merchant's private key. */
export function nagad(definition: ProviderDefinition, fetcher: Fetcher = fetch): PaymentProvider {
  const keys = (context: ProviderContext) => {
    try {
      return {
        nagadKey: createPublicKey(pem(context.settings.pgPublicKey ?? "", "PUBLIC")),
        merchantKey: createPrivateKey(pem(context.secrets.merchantPrivateKey ?? "", "PRIVATE")),
      };
    } catch {
      throw new GatewayError(
        "The Nagad keys can't be read: paste the merchant private key and Nagad's public key exactly as Nagad sent them.",
      );
    }
  };
  const seal = (context: ProviderContext, data: Record<string, string>) => {
    const { nagadKey, merchantKey } = keys(context);
    const plain = JSON.stringify(data);
    const sensitiveData = publicEncrypt(
      { key: nagadKey, padding: constants.RSA_PKCS1_PADDING },
      Buffer.from(plain),
    ).toString("base64");
    const signature = createSign("SHA256").update(plain).sign(merchantKey).toString("base64");
    return { sensitiveData, signature };
  };
  const open = (context: ProviderContext, sealed: string) => {
    const { merchantKey } = keys(context);
    return JSON.parse(
      privateDecrypt(
        { key: merchantKey, padding: constants.RSA_PKCS1_PADDING },
        Buffer.from(sealed, "base64"),
      ).toString("utf8"),
    ) as Record<string, unknown>;
  };
  const headers = {
    "content-type": "application/json",
    "X-KM-Api-Version": "v-0.2.0",
    "X-KM-Client-Type": "PC_WEB",
    "X-KM-IP-V4": "127.0.0.1",
  };
  const dateTime = (now = new Date()) =>
    new Date(now.getTime() + 6 * 3_600_000).toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return {
    id: definition.id,
    kind: "payment",
    async healthCheck(context): Promise<HealthResult> {
      try {
        keys(context);
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
      return checkConnection(definition, context, fetcher);
    },
    async initiate(input, context): Promise<PaymentSession> {
      const merchantId = context.settings.merchantId ?? "";
      const orderId = input.reference.replace(/[^A-Za-z0-9]/g, "");
      const init = await json(
        fetcher,
        `${base(context)}/api/dfs/check-out/initialize/${merchantId}/${orderId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            dateTime: dateTime(),
            ...seal(context, {
              merchantId,
              datetime: dateTime(),
              orderId,
              challenge: randomBytes(20).toString("hex"),
            }),
          }),
          signal: timeout(context),
        },
        "Nagad",
      );
      if (!init.sensitiveData)
        throw new GatewayError(
          `Nagad refused the payment: ${text(init.message) || "no reason given"}.`,
        );
      const opened = open(context, text(init.sensitiveData));
      const complete = await json(
        fetcher,
        `${base(context)}/api/dfs/check-out/complete/${text(opened.paymentReferenceId)}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...seal(context, {
              merchantId,
              orderId,
              currencyCode: "050",
              amount: String(input.amount),
              challenge: text(opened.challenge),
            }),
            merchantCallbackURL: input.successUrl,
            additionalMerchantInfo: { reference: input.reference },
          }),
          signal: timeout(context),
        },
        "Nagad",
      );
      const url = text(complete.callBackUrl);
      if (!url)
        throw new GatewayError(
          `Nagad refused the payment: ${text(complete.message) || "no reason given"}.`,
        );
      return { sessionId: text(opened.paymentReferenceId), redirectUrl: url };
    },
    async verifyCallback(payload, context): Promise<PaymentStatus> {
      const ref = payload.payment_ref_id ?? "";
      if (!ref) return { reference: "", paid: false, amount: 0, transactionId: null };
      const body = await json(
        fetcher,
        `${base(context)}/api/dfs/verify/payment/${encodeURIComponent(ref)}`,
        { method: "GET", headers, signal: timeout(context) },
        "Nagad",
      );
      const info = body.additionalMerchantInfo as { reference?: string } | string | undefined;
      const reference =
        typeof info === "string"
          ? text((JSON.parse(info) as { reference?: string }).reference)
          : text(info?.reference);
      return {
        reference: referenceOf(reference),
        paid: text(body.status) === "Success",
        amount: amountOf(body.amount),
        transactionId: text(body.issuerPaymentRefNo) || text(body.paymentRefId) || null,
      };
    },
    refund: () =>
      Promise.reject(
        new GatewayError("Refund in the Nagad merchant panel, then record it on the order."),
      ),
    query: () =>
      Promise.reject(new GatewayError("Nagad payments are checked with the verify API.")),
  };
}

export const GATEWAY_ADAPTERS: Record<
  OnlineGateway,
  (definition: ProviderDefinition, fetcher?: Fetcher) => PaymentProvider
> = { sslcommerz, bkash, nagad };
