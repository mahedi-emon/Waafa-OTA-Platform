import type { HealthResult, ProviderContext } from "../providers/adapters";
import type { Fetcher } from "../providers/catalogAdapters";

/** What an SMS gateway said, in one plain sentence for staff (Test connection, the notification log). */
export class SmsError extends Error {}

/** The SMS gateways the site can send status messages through (issue 252). */
export const SMS_GATEWAYS = ["bulksmsbd", "ssl-wireless", "twilio"] as const;
export type SmsGateway = (typeof SMS_GATEWAYS)[number];
export const isSmsGateway = (id: string): id is SmsGateway =>
  (SMS_GATEWAYS as readonly string[]).includes(id);

/**
 * A Bangladeshi or international phone in the form gateways take: "8801XXXXXXXXX" for Bangladesh (BulkSMSBD, SSL
 * Wireless) and "+8801…" for Twilio. Returns null when it is not a phone number.
 */
export function smsNumber(phone: string, plus = false): string | null {
  let digits = phone.replace(/[^\d]/g, "");
  if (/^01\d{9}$/.test(digits)) digits = `88${digits}`;
  if (!/^\d{10,15}$/.test(digits)) return null;
  return plus ? `+${digits}` : digits;
}

const base = (context: ProviderContext) => (context.settings.baseUrl ?? "").replace(/\/+$/, "");
const timeout = (context: ProviderContext) => context.signal ?? AbortSignal.timeout(15_000);

async function call(
  fetcher: Fetcher,
  url: string,
  init: RequestInit,
  who: string,
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  let response: Awaited<ReturnType<Fetcher>>;
  try {
    response = await fetcher(url, init);
  } catch {
    throw new SmsError(`${who} did not answer. Check the API base URL and try again.`);
  }
  const body = (await response.json?.().catch(() => null)) as Record<string, unknown> | null;
  return { status: response.status, body: body && typeof body === "object" ? body : null };
}

/** BulkSMSBD's documented response codes, in plain words (202 is success). */
const BULKSMSBD_CODES: Record<number, string> = {
  1001: "BulkSMSBD says the phone number is not valid.",
  1002: "BulkSMSBD says the Sender ID is wrong or switched off. Use the approved Sender ID from your panel.",
  1003: "BulkSMSBD says a required value is missing. Check the API key and Sender ID.",
  1005: "BulkSMSBD had an internal error. Try again in a few minutes.",
  1006: "BulkSMSBD says the balance validity has run out. Recharge the account.",
  1007: "BulkSMSBD says the balance is too low. Recharge the account.",
  1011: "BulkSMSBD does not know this API key.",
  1012: "BulkSMSBD says masking SMS must be in Bangla.",
  1013: "BulkSMSBD says this Sender ID has no gateway for this API key. Ask BulkSMSBD to link them.",
  1014: "BulkSMSBD says this Sender ID's type is not set up for this API key.",
  1015: "BulkSMSBD says this Sender ID has no working gateway. Ask BulkSMSBD to check it.",
  1016: "BulkSMSBD has no active price for this Sender ID. Ask BulkSMSBD to set it.",
  1017: "BulkSMSBD has no price for this Sender ID. Ask BulkSMSBD to set it.",
  1018: "BulkSMSBD says the account is disabled.",
  1019: "BulkSMSBD says this Sender ID's price is disabled for the account.",
  1020: "BulkSMSBD cannot find the parent account. Ask BulkSMSBD to check it.",
  1021: "BulkSMSBD has no active price on the parent account. Ask BulkSMSBD to check it.",
  1031: "BulkSMSBD says the account is not verified yet.",
  1032: "BulkSMSBD blocks this server's IP. Add the server IP (on this card) to the whitelist in the BulkSMSBD panel.",
};

function bulksmsbdProblem(body: Record<string, unknown> | null, status: number): string {
  const code = Number(body?.response_code);
  return (
    BULKSMSBD_CODES[code] ??
    (typeof body?.error_message === "string" && body.error_message
      ? `BulkSMSBD said: ${body.error_message.slice(0, 160)}`
      : `BulkSMSBD answered HTTP ${status} without a result.`)
  );
}

function missing(context: ProviderContext, keys: readonly string[]): string | null {
  const absent = keys.filter((key) => !(context.settings[key] ?? context.secrets[key]));
  return absent.length > 0 ? `Fill in ${absent.join(", ")} first, then save.` : null;
}

export type SmsAdapter = {
  send(to: string, text: string, context: ProviderContext): Promise<void>;
  healthCheck(context: ProviderContext): Promise<HealthResult>;
};

/** BulkSMSBD (bulksmsbd.net): smsapi to send, getBalanceApi as the health check. */
function bulksmsbd(fetcher: Fetcher): SmsAdapter {
  return {
    async send(to, text, context) {
      const problem = missing(context, ["baseUrl", "senderId", "apiKey"]);
      if (problem) throw new SmsError(problem);
      const number = smsNumber(to);
      if (!number) throw new SmsError("This phone number cannot take an SMS.");
      const query = new URLSearchParams({
        api_key: context.secrets.apiKey ?? "",
        type: "text",
        number,
        senderid: context.settings.senderId ?? "",
        message: text,
      });
      const { status, body } = await call(
        fetcher,
        `${base(context)}/api/smsapi`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: query.toString(),
          signal: timeout(context),
        },
        "BulkSMSBD",
      );
      if (Number(body?.response_code) !== 202) throw new SmsError(bulksmsbdProblem(body, status));
    },
    async healthCheck(context) {
      const problem = missing(context, ["baseUrl", "senderId", "apiKey"]);
      if (problem) return { ok: false, message: problem };
      try {
        const query = new URLSearchParams({ api_key: context.secrets.apiKey ?? "" });
        const { status, body } = await call(
          fetcher,
          `${base(context)}/api/getBalanceApi?${query.toString()}`,
          { method: "GET", signal: timeout(context) },
          "BulkSMSBD",
        );
        if (Number(body?.response_code) !== 202)
          return { ok: false, message: bulksmsbdProblem(body, status) };
        const balance = Number(body?.balance);
        return {
          ok: true,
          message: Number.isFinite(balance)
            ? `BulkSMSBD accepts the API key; balance ${balance.toFixed(2)} taka. Send a test SMS to check the Sender ID.`
            : "BulkSMSBD accepts the API key. Send a test SMS to check the Sender ID.",
        };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
  };
}

/** SSL Wireless SMS Plus (API v3): send-sms with a JSON body; status "SUCCESS" means accepted. */
function sslWireless(fetcher: Fetcher): SmsAdapter {
  const problemOf = (body: Record<string, unknown> | null, status: number) => {
    const said = typeof body?.error_message === "string" ? body.error_message : "";
    if (status === 401 || /token/i.test(said))
      return "SSL Wireless does not accept this API token.";
    if (/sid/i.test(said)) return "SSL Wireless does not accept this SID (sender ID).";
    if (/ip/i.test(said))
      return "SSL Wireless blocks this server's IP. Give them the server IP shown on this card.";
    if (/balance/i.test(said)) return "SSL Wireless says the balance is too low. Recharge it.";
    return said
      ? `SSL Wireless said: ${said.slice(0, 160)}`
      : `SSL Wireless answered HTTP ${status} without a result.`;
  };
  return {
    async send(to, text, context) {
      const problem = missing(context, ["baseUrl", "sid", "apiToken"]);
      if (problem) throw new SmsError(problem);
      const number = smsNumber(to);
      if (!number) throw new SmsError("This phone number cannot take an SMS.");
      const { status, body } = await call(
        fetcher,
        `${base(context)}/api/v3/send-sms`,
        {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            api_token: context.secrets.apiToken,
            sid: context.settings.sid,
            msisdn: number,
            sms: text,
            csms_id: `W${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
          }),
          signal: timeout(context),
        },
        "SSL Wireless",
      );
      if (body?.status !== "SUCCESS") throw new SmsError(problemOf(body, status));
    },
    async healthCheck(context) {
      const problem = missing(context, ["baseUrl", "sid", "apiToken"]);
      if (problem) return { ok: false, message: problem };
      try {
        const query = new URLSearchParams({ api_token: context.secrets.apiToken ?? "" });
        const { status, body } = await call(
          fetcher,
          `${base(context)}/api/v3/balance?${query.toString()}`,
          { method: "GET", headers: { accept: "application/json" }, signal: timeout(context) },
          "SSL Wireless",
        );
        // Accounts without the balance endpoint: the host answers, so the test SMS confirms the token and SID.
        if (status === 404 || !body)
          return {
            ok: true,
            message: "SSL Wireless answers. Send a test SMS to confirm the API token and SID.",
          };
        if (body.status !== "SUCCESS") return { ok: false, message: problemOf(body, status) };
        return {
          ok: true,
          message: "SSL Wireless accepts the API token. Send a test SMS to check the SID.",
        };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
  };
}

/** Twilio Programmable Messaging: Messages.json with HTTP basic auth (Account SID and Auth token). */
function twilio(fetcher: Fetcher): SmsAdapter {
  const auth = (context: ProviderContext) =>
    `Basic ${Buffer.from(`${context.settings.accountSid ?? ""}:${context.secrets.authToken ?? ""}`).toString("base64")}`;
  const account = (context: ProviderContext) =>
    `${base(context) || "https://api.twilio.com"}/2010-04-01/Accounts/${encodeURIComponent(context.settings.accountSid ?? "")}`;
  return {
    async send(to, text, context) {
      const problem = missing(context, ["accountSid", "authToken", "from"]);
      if (problem) throw new SmsError(problem);
      const number = smsNumber(to, true);
      if (!number) throw new SmsError("This phone number cannot take an SMS.");
      const { status, body } = await call(
        fetcher,
        `${account(context)}/Messages.json`,
        {
          method: "POST",
          headers: {
            authorization: auth(context),
            "content-type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: number,
            From: context.settings.from ?? "",
            Body: text,
          }).toString(),
          signal: timeout(context),
        },
        "Twilio",
      );
      if (status === 401)
        throw new SmsError("Twilio does not accept this Account SID and Auth token.");
      if (status !== 201)
        throw new SmsError(
          typeof body?.message === "string"
            ? `Twilio said: ${body.message.slice(0, 160)}`
            : `Twilio answered HTTP ${status}.`,
        );
    },
    async healthCheck(context) {
      const problem = missing(context, ["accountSid", "authToken", "from"]);
      if (problem) return { ok: false, message: problem };
      try {
        const { status } = await call(
          fetcher,
          `${account(context)}.json`,
          { method: "GET", headers: { authorization: auth(context) }, signal: timeout(context) },
          "Twilio",
        );
        if (status === 401 || status === 404)
          return { ok: false, message: "Twilio does not accept this Account SID and Auth token." };
        if (status !== 200) return { ok: false, message: `Twilio answered HTTP ${status}.` };
        return {
          ok: true,
          message: "Twilio accepts the account. Send a test SMS to check the From number.",
        };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
  };
}

export function smsAdapter(id: SmsGateway, fetcher: Fetcher = fetch): SmsAdapter {
  return id === "bulksmsbd"
    ? bulksmsbd(fetcher)
    : id === "ssl-wireless"
      ? sslWireless(fetcher)
      : twilio(fetcher);
}
