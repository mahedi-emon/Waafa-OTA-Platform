import type { HealthResult, ProviderContext } from "../providers/adapters";
import type { Fetcher } from "../providers/catalogAdapters";

/** What the courier said, in one plain sentence for staff. */
export class CourierError extends Error {}

/** A parcel to book: the order's reference is the courier's invoice number, so status can be read by it. */
export type ParcelInput = {
  invoice: string;
  name: string;
  /** E.164 (+8801…); Steadfast takes the 11-digit local form. */
  phone: string;
  address: string;
  /** Cash to collect, in taka (0 when paid already). */
  cod: number;
  note?: string;
};

export type Parcel = { consignmentId: string; trackingCode: string; status: string };

/** Where a parcel is, in the words the order history and the customer see; `final` moves the order. */
export type ParcelState = {
  status: string;
  words: string;
  final?: "delivered" | "cancelled";
};

/** Steadfast's delivery statuses (packzy API v1), in plain words. */
const STATES: Record<string, Omit<ParcelState, "status">> = {
  pending: { words: "Booked with the courier, waiting for pickup" },
  in_review: { words: "Booked with the courier, being reviewed" },
  hold: { words: "On hold at the courier" },
  delivered_approval_pending: { words: "Delivered, the courier is confirming it" },
  partial_delivered_approval_pending: { words: "Partly delivered, the courier is confirming it" },
  cancelled_approval_pending: { words: "Delivery cancelled, the courier is confirming it" },
  unknown_approval_pending: { words: "The courier is checking the parcel" },
  delivered: { words: "Delivered by the courier", final: "delivered" },
  partial_delivered: { words: "Partly delivered by the courier" },
  cancelled: { words: "The courier could not deliver it; it is coming back", final: "cancelled" },
  unknown: { words: "The courier is checking the parcel" },
};

export function parcelState(status: string): ParcelState {
  const known = STATES[status];
  return known
    ? { status, ...known }
    : { status, words: `Courier status: ${status.replace(/_/g, " ")}` };
}

/** "+8801712345678" → "01712345678"; null when it is not a Bangladeshi mobile number. */
export function localPhone(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  const local = digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
  return /^01\d{9}$/.test(local) ? local : null;
}

const base = (context: ProviderContext) =>
  (context.settings.baseUrl || "https://portal.packzy.com/api/v1").replace(/\/+$/, "");

/**
 * Steadfast Courier (portal.packzy.com API v1): create_order books a parcel, status_by_invoice reads it, get_balance is
 * the health check. Every refusal comes back as one plain sentence.
 */
export function steadfast(fetcher: Fetcher = fetch) {
  async function call(
    context: ProviderContext,
    path: string,
    init: { method: "GET" | "POST"; body?: unknown },
  ): Promise<Record<string, unknown>> {
    if (!context.settings.apiKey || !context.secrets.secretKey)
      throw new CourierError("Fill in the Steadfast API key and Secret key first, then save.");
    let response: Awaited<ReturnType<Fetcher>>;
    try {
      response = await fetcher(`${base(context)}${path}`, {
        method: init.method,
        headers: {
          "Api-Key": context.settings.apiKey,
          "Secret-Key": context.secrets.secretKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
        signal: context.signal ?? AbortSignal.timeout(15_000),
      });
    } catch {
      throw new CourierError("Steadfast did not answer. Check the API base URL and try again.");
    }
    const body = (await response.json?.().catch(() => null)) as Record<string, unknown> | null;
    if (response.status === 401 || response.status === 403)
      throw new CourierError("Steadfast does not accept this API key and Secret key.");
    if (!body || typeof body !== "object")
      throw new CourierError(
        `Steadfast answered HTTP ${response.status} without the expected data.`,
      );
    const status = Number(body.status ?? response.status);
    if (status !== 200) {
      const errors = body.errors as Record<string, unknown> | undefined;
      const first = errors ? Object.values(errors).flat()[0] : undefined;
      const said =
        typeof first === "string"
          ? first
          : typeof body.message === "string"
            ? body.message
            : `HTTP ${response.status}`;
      throw new CourierError(`Steadfast said: ${said.slice(0, 160)}`);
    }
    return body;
  }

  return {
    async book(input: ParcelInput, context: ProviderContext): Promise<Parcel> {
      const phone = localPhone(input.phone);
      if (!phone)
        throw new CourierError(
          "Steadfast delivers to Bangladeshi mobile numbers only (01XXXXXXXXX).",
        );
      const body = await call(context, "/create_order", {
        method: "POST",
        body: {
          invoice: input.invoice,
          recipient_name: input.name.slice(0, 100),
          recipient_phone: phone,
          recipient_address: input.address.slice(0, 250),
          cod_amount: Math.max(0, Math.round(input.cod)),
          note: (input.note ?? "").slice(0, 200),
        },
      });
      const consignment = body.consignment as Record<string, unknown> | undefined;
      const consignmentId = consignment?.consignment_id;
      const trackingCode = consignment?.tracking_code;
      if (consignmentId == null || typeof trackingCode !== "string" || !trackingCode)
        throw new CourierError("Steadfast booked nothing: it sent no tracking code. Try again.");
      return {
        consignmentId: String(consignmentId),
        trackingCode,
        status: typeof consignment?.status === "string" ? consignment.status : "in_review",
      };
    },

    async status(invoice: string, context: ProviderContext): Promise<ParcelState> {
      const body = await call(context, `/status_by_invoice/${encodeURIComponent(invoice)}`, {
        method: "GET",
      });
      const status = typeof body.delivery_status === "string" ? body.delivery_status : "unknown";
      return parcelState(status);
    },

    async healthCheck(context: ProviderContext): Promise<HealthResult> {
      try {
        const body = await call(context, "/get_balance", { method: "GET" });
        const balance = Number(body.current_balance);
        return {
          ok: true,
          message: Number.isFinite(balance)
            ? `Steadfast accepts the keys; balance ${balance.toFixed(2)} taka.`
            : "Steadfast accepts the keys.",
        };
      } catch (error) {
        return { ok: false, message: (error as Error).message };
      }
    },
  };
}

export type SteadfastAdapter = ReturnType<typeof steadfast>;
