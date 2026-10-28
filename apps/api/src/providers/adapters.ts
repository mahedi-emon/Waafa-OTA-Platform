import type {
  Booking,
  FareRule,
  FlightOffer,
  FlightSearch,
  HotelOffer,
  HotelSearch,
  ProviderEnvironment,
  ProviderKey,
  RatePlan,
  Ticket,
} from "@waafa/shared";

/*
 * The provider adapter pattern (PRD FR-GS-06). The registry talks to these interfaces only; every adapter maps its
 * supplier's payloads to the shared normalised schemas, and raw payloads stay in the API for audit, never in the
 * browser. Phase E fills the GDS, consolidator and gateway adapters once contracts and sandbox access exist.
 */

/** What an adapter gets for one call: the saved connection, secrets already opened. */
export type ProviderContext = {
  environment: ProviderEnvironment;
  settings: Readonly<Record<string, string>>;
  secrets: Readonly<Record<string, string>>;
  signal?: AbortSignal;
};

export type HealthResult = { ok: boolean; message: string };

export type Traveller = {
  type: "adult" | "child" | "infant";
  title: string;
  givenName: string;
  surname: string;
  dateOfBirth: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
};

export type BookingContact = { name: string; phone: string; email?: string };

export interface FlightProvider {
  readonly id: ProviderKey | "manual-flight";
  readonly kind: "flight";
  healthCheck(context: ProviderContext): Promise<HealthResult>;
  search(query: FlightSearch, context: ProviderContext): Promise<FlightOffer[]>;
  /** Re-prices an offer right before booking; null when it is gone. */
  revalidate(offerId: string, context: ProviderContext): Promise<FlightOffer | null>;
  fareRules(offerId: string, context: ProviderContext): Promise<FareRule[]>;
  /** Creates the PNR. */
  book(
    input: { offerId: string; travellers: Traveller[]; contact: BookingContact; reference: string },
    context: ProviderContext,
  ): Promise<Booking>;
  issueTicket(pnr: string, context: ProviderContext): Promise<Ticket[]>;
  /** Cancels a held booking or voids a ticket inside the void window. */
  cancel(pnr: string, context: ProviderContext): Promise<void>;
  retrieve(pnr: string, context: ProviderContext): Promise<Booking>;
}

export interface HotelProvider {
  readonly id: ProviderKey | "manual-hotel";
  readonly kind: "hotel";
  healthCheck(context: ProviderContext): Promise<HealthResult>;
  search(query: HotelSearch, context: ProviderContext): Promise<HotelOffer[]>;
  hotelDetail(hotelId: string, context: ProviderContext): Promise<HotelOffer | null>;
  rates(hotelId: string, query: HotelSearch, context: ProviderContext): Promise<RatePlan[]>;
  book(
    input: {
      hotelId: string;
      ratePlanId: string;
      guests: Traveller[];
      contact: BookingContact;
      reference: string;
    },
    context: ProviderContext,
  ): Promise<Booking>;
  cancel(confirmation: string, context: ProviderContext): Promise<void>;
  retrieve(confirmation: string, context: ProviderContext): Promise<Booking>;
}

export type PaymentSession = { sessionId: string; redirectUrl: string };
export type PaymentStatus = {
  reference: string;
  paid: boolean;
  amount: number;
  transactionId: string | null;
};

export interface PaymentProvider {
  readonly id: ProviderKey;
  readonly kind: "payment";
  healthCheck(context: ProviderContext): Promise<HealthResult>;
  initiate(
    input: {
      reference: string;
      amount: number;
      customer: BookingContact;
      successUrl: string;
      failUrl: string;
      cancelUrl: string;
    },
    context: ProviderContext,
  ): Promise<PaymentSession>;
  /** Validates the gateway's callback with the gateway itself, never trusting the posted fields alone. */
  verifyCallback(payload: Record<string, string>, context: ProviderContext): Promise<PaymentStatus>;
  refund(
    input: { transactionId: string; amount: number; reason: string },
    context: ProviderContext,
  ): Promise<{ refundId: string }>;
  query(reference: string, context: ProviderContext): Promise<PaymentStatus>;
}

/**
 * SMS and email providers (#107): the connection is stored and checked today; email delivery reads the active email
 * provider (notifications/integrationMailer), SMS sending arrives with the SMS phase (Phase D).
 */
export interface MessagingProvider {
  readonly id: ProviderKey;
  readonly kind: "sms" | "email";
  healthCheck(context: ProviderContext): Promise<HealthResult>;
}

/** Customer sign-in providers (issue 134): the connection is checked here; the sign-in flow is in customers/. */
export interface SignInProvider {
  readonly id: ProviderKey;
  readonly kind: "auth";
  healthCheck(context: ProviderContext): Promise<HealthResult>;
}

/**
 * Services added in issue 284 (Turnstile, measurement IDs, error tracking, off-site storage, Telegram, couriers): the
 * connection is checked here; the features that use them read the active config.
 */
export interface ServiceProvider {
  readonly id: ProviderKey;
  readonly kind: "captcha" | "analytics" | "monitoring" | "storage" | "alerts" | "courier";
  healthCheck(context: ProviderContext): Promise<HealthResult>;
}

export type ProviderAdapter =
  | FlightProvider
  | HotelProvider
  | PaymentProvider
  | MessagingProvider
  | SignInProvider
  | ServiceProvider;

/** Thrown by an adapter that cannot do a call yet (stub before certification, Manual mode). */
export class ProviderUnavailableError extends Error {
  constructor(
    readonly provider: string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}
