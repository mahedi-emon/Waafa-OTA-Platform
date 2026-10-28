import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

/**
 * External API connections (PRD FR-GS-06 to 08, #82, #107): flight, hotel, payment, SMS and email providers plug in
 * behind the adapter interfaces in the API. Admin › Settings › Integrations keeps one setting per provider (Active,
 * Sandbox or Live credentials, markup) and one credential set per environment; secrets are encrypted at rest and only
 * leave the API through the audited reveal. Connecting a provider never switches a module to Live (the Golden Switch
 * keeps Live locked until Phase E).
 */

/**
 * "auth": customer sign-in providers (Google, issue 134); no custom ones, the sign-in flow is built per provider.
 * Issue 284 adds every other outside service: captcha (Turnstile), analytics (GA4, GTM, Meta Pixel, search engine
 * verification), monitoring (error tracking), storage (off-site backups), alerts (Telegram) and courier.
 */
export const ProviderKindSchema = z.enum([
  "flight",
  "hotel",
  "payment",
  "sms",
  "email",
  "auth",
  "captcha",
  "analytics",
  "monitoring",
  "storage",
  "alerts",
  "courier",
]);
/** Kinds staff may add their own supplier to (a custom REST connection). */
export const SUPPLIER_KINDS = ["flight", "hotel", "payment", "sms", "email"] as const;
export const ProviderEnvironmentSchema = z.enum(["sandbox", "production"]);

export const PROVIDER_IDS = [
  "sabre",
  "amadeus",
  "travelport",
  "flyhub",
  "bdfare",
  "hotelbeds",
  "sslcommerz",
  "bkash",
  "nagad",
  "ssl-wireless",
  "bulksmsbd",
  "twilio",
  "resend",
  "smtp",
  "google",
  "turnstile",
  "ga4",
  "gtm",
  "meta-pixel",
  "search-console",
  "bing",
  "sentry",
  "glitchtip",
  "r2",
  "b2",
  "telegram",
  "steadfast",
  "pathao",
  "redx",
] as const;
export const ProviderIdSchema = z.enum(PROVIDER_IDS);

/** A provider the admin adds: "custom-<kind>-<slug>", e.g. "custom-flight-galileo-bd". */
export const CUSTOM_PROVIDER_PATTERN =
  /^custom-(flight|hotel|payment|sms|email)-[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
export const ProviderKeySchema = z.union([
  ProviderIdSchema,
  z.string().regex(CUSTOM_PROVIDER_PATTERN, "Unknown provider"),
]);

export type ProviderKind = z.infer<typeof ProviderKindSchema>;
export type ProviderEnvironment = z.infer<typeof ProviderEnvironmentSchema>;
export type ProviderId = z.infer<typeof ProviderIdSchema>;
/** A catalog provider or one the admin added. */
export type ProviderKey = z.infer<typeof ProviderKeySchema>;

export type ProviderField = {
  key: string;
  label: string;
  /** Secrets are encrypted at rest and shown masked; the rest are plain settings. */
  secret: boolean;
  required: boolean;
  /** "url" fields must be full https addresses; "number" fields whole numbers (SMTP port). */
  type: "text" | "url" | "number";
  hint?: string;
  /** A regular expression (source) the value must match, with the message shown when it does not (issue 284). */
  pattern?: string;
  patternMessage?: string;
};

export type ProviderDefinition = {
  id: ProviderKey;
  name: string;
  kind: ProviderKind;
  /** What it does on our site, in plain words. */
  summary: string;
  /** Where staff get the keys (opens in a new tab). */
  keysUrl?: string;
  /** One set of values, no Sandbox: saved and used as Live (measurement IDs, DSNs, storage, Telegram). */
  liveOnly?: boolean;
  /** Plain settings the visitor's browser may receive (site key, measurement IDs); never a secret. */
  publicFields?: readonly string[];
  fields: ProviderField[];
};

const url = (hint: string): ProviderField => ({
  key: "baseUrl",
  label: "API base URL",
  secret: false,
  required: true,
  type: "url",
  hint,
});
const text = (key: string, label: string, required = true, hint?: string): ProviderField => ({
  key,
  label,
  secret: false,
  required,
  type: "text",
  ...(hint ? { hint } : {}),
});
const secret = (key: string, label: string, required = true): ProviderField => ({
  key,
  label,
  secret: true,
  required,
  type: "text",
});
/** A plain value with a fixed shape (measurement IDs, tokens). */
const shaped = (
  key: string,
  label: string,
  pattern: string,
  patternMessage: string,
  hint?: string,
): ProviderField => ({ ...text(key, label, true, hint), pattern, patternMessage });

/** Every provider the API has an adapter (or a contract-tested stub) for. */
export const PROVIDER_CATALOG: Record<ProviderId, ProviderDefinition> = {
  sabre: {
    id: "sabre",
    name: "Sabre",
    kind: "flight",
    keysUrl: "https://developer.sabre.com",
    summary: "Airline booking system: live fares, seat holds and tickets",
    fields: [
      url("From the Sabre Dev Studio account, e.g. the certification host for sandbox"),
      text("clientId", "Client ID"),
      secret("clientSecret", "Client secret"),
      text("pcc", "PCC (pseudo city code)"),
    ],
  },
  amadeus: {
    id: "amadeus",
    name: "Amadeus",
    kind: "flight",
    keysUrl: "https://developers.amadeus.com",
    summary: "Airline booking system: live fares, seat holds and tickets",
    fields: [
      url("The test or production host from the Amadeus account"),
      text("apiKey", "API key"),
      secret("apiSecret", "API secret"),
      text("officeId", "Office ID", false),
    ],
  },
  travelport: {
    id: "travelport",
    name: "Travelport",
    kind: "flight",
    keysUrl: "https://developer.travelport.com",
    summary: "Airline booking system: live fares, seat holds and tickets",
    fields: [
      url("The pre-production or production host from Travelport"),
      text("username", "Username"),
      secret("password", "Password"),
      text("targetBranch", "Target branch"),
    ],
  },
  flyhub: {
    id: "flyhub",
    name: "FlyHub",
    kind: "flight",
    keysUrl: "https://www.flyhub.com",
    summary: "Ticket wholesaler: live fares, bookings and tickets",
    fields: [
      url("The API host FlyHub gives with the B2B account"),
      text("username", "Username"),
      secret("apiKey", "API key"),
    ],
  },
  bdfare: {
    id: "bdfare",
    name: "BDFare",
    kind: "flight",
    keysUrl: "https://bdfare.com",
    summary: "Ticket wholesaler: live fares, bookings and tickets",
    fields: [
      url("The API host BDFare gives with the B2B account"),
      text("username", "Username", false),
      secret("apiKey", "API key"),
    ],
  },
  hotelbeds: {
    id: "hotelbeds",
    name: "Hotelbeds",
    kind: "hotel",
    keysUrl: "https://developer.hotelbeds.com",
    summary: "Hotel supplier: free rooms, prices and bookings",
    fields: [
      url("The test or live host from the Hotelbeds account"),
      text("apiKey", "API key"),
      secret("secret", "Secret"),
    ],
  },
  sslcommerz: {
    id: "sslcommerz",
    name: "SSLCommerz",
    kind: "payment",
    keysUrl: "https://developer.sslcommerz.com",
    summary: "Cards, mobile banking and net banking",
    fields: [
      url("sandbox.sslcommerz.com for sandbox, securepay.sslcommerz.com for live"),
      text("storeId", "Store ID"),
      secret("storePassword", "Store password"),
    ],
  },
  bkash: {
    id: "bkash",
    name: "bKash",
    kind: "payment",
    keysUrl: "https://developer.bka.sh",
    summary: "bKash tokenized checkout",
    fields: [
      url("The sandbox or live tokenized checkout host from bKash"),
      text("appKey", "App key"),
      secret("appSecret", "App secret"),
      text("username", "Username"),
      secret("password", "Password"),
    ],
  },
  nagad: {
    id: "nagad",
    name: "Nagad",
    kind: "payment",
    keysUrl: "https://nagad.com.bd",
    summary: "Nagad merchant checkout",
    fields: [
      url("The sandbox or live host from Nagad"),
      text("merchantId", "Merchant ID"),
      secret("merchantPrivateKey", "Merchant private key"),
      text("pgPublicKey", "Nagad public key"),
    ],
  },
  "ssl-wireless": {
    id: "ssl-wireless",
    name: "SSL Wireless",
    kind: "sms",
    keysUrl: "https://sslwireless.com",
    summary: "Bulk and transactional SMS in Bangladesh",
    fields: [
      url("The SMS API host from the SSL Wireless account"),
      text("sid", "SID (sender ID)"),
      secret("apiToken", "API token"),
    ],
  },
  bulksmsbd: {
    id: "bulksmsbd",
    name: "BulkSMSBD",
    kind: "sms",
    keysUrl: "https://bulksmsbd.net",
    summary: "Transactional SMS in Bangladesh",
    fields: [
      url("The API host from the BulkSMSBD account"),
      text("senderId", "Sender ID"),
      secret("apiKey", "API key"),
    ],
  },
  twilio: {
    id: "twilio",
    name: "Twilio",
    kind: "sms",
    keysUrl: "https://console.twilio.com",
    summary: "International SMS and WhatsApp messages",
    fields: [
      url("https://api.twilio.com"),
      text("accountSid", "Account SID"),
      secret("authToken", "Auth token"),
      text("from", "From number", true, "In international format, e.g. +1 415 555 0100"),
    ],
  },
  resend: {
    id: "resend",
    name: "Resend",
    kind: "email",
    keysUrl: "https://resend.com/api-keys",
    summary: "Transactional email (staff alerts, customer receipts)",
    fields: [
      url("https://api.resend.com"),
      text(
        "from",
        "From address",
        true,
        "e.g. WAAFA <info@yourdomain.com>, on a domain verified in Resend",
      ),
      secret("apiKey", "API key"),
    ],
  },
  smtp: {
    id: "smtp",
    name: "SMTP server",
    kind: "email",
    keysUrl: "https://support.google.com/a/answer/176600",
    summary: "Any mailbox provider that offers SMTP (Google Workspace, Zoho, cPanel mail)",
    fields: [
      text("host", "SMTP host", true, "e.g. smtp.gmail.com"),
      {
        key: "port",
        label: "Port",
        secret: false,
        required: true,
        type: "number",
        hint: "587 (STARTTLS) or 465 (SSL)",
      },
      text("username", "Username"),
      secret("password", "Password or app password"),
      text("from", "From address", true, "e.g. WAAFA <info@yourdomain.com>"),
    ],
  },
  google: {
    id: "google",
    name: "Google sign-in",
    kind: "auth",
    keysUrl: "https://console.cloud.google.com/apis/credentials",
    summary: "Customers sign in with their Google account (My account: requests and orders)",
    fields: [
      text(
        "clientId",
        "Client ID",
        true,
        "Google Cloud › APIs & Services › Credentials › OAuth client ID (Web application); ends in .apps.googleusercontent.com",
      ),
      secret("clientSecret", "Client secret"),
    ],
  },
  turnstile: {
    id: "turnstile",
    name: "Cloudflare Turnstile",
    kind: "captcha",
    summary:
      "Stops robots on every public form (requests, sign-in codes, feedback) without a puzzle for people",
    keysUrl: "https://dash.cloudflare.com/?to=/:account/turnstile",
    publicFields: ["siteKey"],
    fields: [
      shaped(
        "siteKey",
        "Site key",
        "^[0-3]x[A-Za-z0-9_-]{10,}$",
        "A Turnstile site key starts with 0x (test keys with 1x, 2x or 3x)",
        "Sandbox: Cloudflare's test key 1x00000000000000000000AA always passes",
      ),
      secret("secretKey", "Secret key"),
    ],
  },
  ga4: {
    id: "ga4",
    name: "Google Analytics 4",
    kind: "analytics",
    summary: "Counts visits and conversions (requests, orders) after the visitor accepts cookies",
    keysUrl: "https://analytics.google.com",
    liveOnly: true,
    publicFields: ["measurementId"],
    fields: [
      shaped(
        "measurementId",
        "Measurement ID",
        "^G-[A-Z0-9]{4,15}$",
        "A GA4 measurement ID looks like G-ABC1234567",
        "Admin › Data streams › Web › Measurement ID",
      ),
    ],
  },
  gtm: {
    id: "gtm",
    name: "Google Tag Manager",
    kind: "analytics",
    summary: "Loads the marketing tags your team manages in Tag Manager, after cookie consent",
    keysUrl: "https://tagmanager.google.com",
    liveOnly: true,
    publicFields: ["containerId"],
    fields: [
      shaped(
        "containerId",
        "Container ID",
        "^GTM-[A-Z0-9]{4,12}$",
        "A container ID looks like GTM-AB12CD3",
      ),
    ],
  },
  "meta-pixel": {
    id: "meta-pixel",
    name: "Meta Pixel",
    kind: "analytics",
    summary: "Measures Facebook and Instagram ads (leads, orders) after cookie consent",
    keysUrl: "https://business.facebook.com/events_manager2",
    liveOnly: true,
    publicFields: ["pixelId"],
    fields: [shaped("pixelId", "Pixel ID", "^\\d{10,20}$", "A Pixel ID is 10 to 20 digits")],
  },
  "search-console": {
    id: "search-console",
    name: "Google Search Console",
    kind: "analytics",
    summary: "Proves to Google that you own the site, so you can see searches and indexing",
    keysUrl: "https://search.google.com/search-console",
    liveOnly: true,
    publicFields: ["token"],
    fields: [
      shaped(
        "token",
        "Verification code",
        "^[A-Za-z0-9_-]{20,100}$",
        "Paste only the content value of the google-site-verification tag",
        'Settings › Ownership verification › HTML tag: the part inside content="…"',
      ),
    ],
  },
  bing: {
    id: "bing",
    name: "Bing Webmaster Tools",
    kind: "analytics",
    summary: "Proves to Bing that you own the site (Bing also feeds ChatGPT search)",
    keysUrl: "https://www.bing.com/webmasters",
    liveOnly: true,
    publicFields: ["token"],
    fields: [
      shaped(
        "token",
        "Verification code",
        "^[A-Fa-f0-9]{32}$",
        "Paste only the content value of the msvalidate.01 tag (32 letters and digits)",
      ),
    ],
  },
  sentry: {
    id: "sentry",
    name: "Sentry",
    kind: "monitoring",
    summary:
      "Sends site, API and worker errors to Sentry with the release, so problems are fixed fast",
    keysUrl: "https://sentry.io",
    liveOnly: true,
    publicFields: ["dsn"],
    fields: [
      shaped(
        "dsn",
        "DSN",
        "^https://[A-Za-z0-9]+@[A-Za-z0-9.-]+(?::\\d+)?/\\d+$",
        "A DSN looks like https://abc123@o123.ingest.sentry.io/456",
        "Project settings › Client keys (DSN)",
      ),
    ],
  },
  glitchtip: {
    id: "glitchtip",
    name: "GlitchTip",
    kind: "monitoring",
    summary: "Error tracking like Sentry, free or self-hosted",
    keysUrl: "https://app.glitchtip.com",
    liveOnly: true,
    publicFields: ["dsn"],
    fields: [
      shaped(
        "dsn",
        "DSN",
        "^https://[A-Za-z0-9]+@[A-Za-z0-9.-]+(?::\\d+)?/\\d+$",
        "A DSN looks like https://abc123@app.glitchtip.com/456",
      ),
    ],
  },
  r2: {
    id: "r2",
    name: "Cloudflare R2",
    kind: "storage",
    summary: "Keeps a copy of the daily database and photo backups outside the server (10 GB free)",
    keysUrl: "https://dash.cloudflare.com/?to=/:account/r2",
    liveOnly: true,
    fields: [
      shaped(
        "accountId",
        "Account ID",
        "^[a-f0-9]{32}$",
        "The Cloudflare account ID is 32 letters and digits",
      ),
      shaped(
        "bucket",
        "Bucket name",
        "^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$",
        "Use the bucket's name: small letters, digits, dots and dashes",
      ),
      text(
        "accessKeyId",
        "Access key ID",
        true,
        "R2 › Manage API tokens: a token limited to this bucket",
      ),
      secret("secretAccessKey", "Secret access key"),
    ],
  },
  b2: {
    id: "b2",
    name: "Backblaze B2",
    kind: "storage",
    summary: "Keeps a copy of the daily database and photo backups outside the server",
    keysUrl: "https://secure.backblaze.com/app_keys.htm",
    liveOnly: true,
    fields: [
      {
        ...url("The bucket's S3 endpoint, e.g. https://s3.us-west-004.backblazeb2.com"),
        key: "endpoint",
        label: "S3 endpoint",
      },
      shaped(
        "bucket",
        "Bucket name",
        "^[A-Za-z0-9-]{6,50}$",
        "Use the bucket's name: letters, digits and dashes",
      ),
      text("keyId", "Key ID", true, "An application key limited to this bucket"),
      secret("applicationKey", "Application key"),
    ],
  },
  telegram: {
    id: "telegram",
    name: "Telegram alerts",
    kind: "alerts",
    summary: "Posts every new request and order to your sales group on Telegram at once",
    keysUrl: "https://t.me/BotFather",
    liveOnly: true,
    fields: [
      {
        ...secret("botToken", "Bot token"),
        pattern: "^\\d{6,12}:[A-Za-z0-9_-]{30,50}$",
        patternMessage: "A bot token looks like 123456789:AAE… (from @BotFather)",
      },
      shaped(
        "chatId",
        "Group chat ID",
        "^-?\\d{5,20}$",
        "The group chat ID is a number, usually starting with -100",
        "Add the bot to the sales group, then use the group's ID",
      ),
    ],
  },
  steadfast: {
    id: "steadfast",
    name: "Steadfast Courier",
    kind: "courier",
    summary: "Books Waafa’s World deliveries and shows the parcel status to the customer",
    keysUrl: "https://steadfast.com.bd",
    fields: [
      url("https://portal.packzy.com/api/v1"),
      text("apiKey", "API key"),
      secret("secretKey", "Secret key"),
    ],
  },
  pathao: {
    id: "pathao",
    name: "Pathao Courier",
    kind: "courier",
    summary: "Books Waafa’s World deliveries and shows the parcel status to the customer",
    keysUrl: "https://merchant.pathao.com",
    fields: [
      url("Sandbox: https://courier-api-sandbox.pathao.com; live: https://api-hermes.pathao.com"),
      text("clientId", "Client ID"),
      secret("clientSecret", "Client secret"),
      text("username", "Merchant email"),
      secret("password", "Merchant password"),
      text("storeId", "Store ID"),
    ],
  },
  redx: {
    id: "redx",
    name: "RedX",
    kind: "courier",
    summary: "Books Waafa’s World deliveries and shows the parcel status to the customer",
    keysUrl: "https://redx.com.bd",
    fields: [
      url(
        "Sandbox: https://sandbox.redx.com.bd/v1.0.0-beta; live: https://openapi.redx.com.bd/v1.0.0-beta",
      ),
      secret("apiToken", "API token"),
    ],
  },
};

/**
 * Fields of a provider the admin adds (#107): enough for most REST APIs. The adapter that uses them is written when
 * the supplier's contract lands; until then the connection is stored, tested for reachability and kept off.
 */
export function customProviderFields(): ProviderField[] {
  return [
    url("The supplier's API host"),
    text("clientId", "Client ID or username", false),
    text("authHeader", "Auth header name", false, "e.g. Authorization or X-Api-Key"),
    text("extraHeaders", "Extra headers", false, 'JSON, e.g. {"X-Agency": "WAAFA"}'),
    secret("apiKey", "API key or token"),
    secret("apiSecret", "API secret", false),
  ];
}

export function isCustomProvider(key: string): boolean {
  return CUSTOM_PROVIDER_PATTERN.test(key);
}

/** The kind a custom provider key carries ("custom-sms-…" → "sms"). */
export function customProviderKind(key: string): ProviderKind | null {
  const match = CUSTOM_PROVIDER_PATTERN.exec(key);
  return match ? (match[1] as ProviderKind) : null;
}

/** The definition for a catalog provider or an admin-added one (its name comes from the saved setting). */
export function providerDefinition(key: string, customName?: string): ProviderDefinition | null {
  if ((PROVIDER_IDS as readonly string[]).includes(key)) return PROVIDER_CATALOG[key as ProviderId];
  const kind = customProviderKind(key);
  if (!kind) return null;
  return {
    id: key,
    name: customName ?? key,
    kind,
    summary: "Added in Admin; it starts working once the supplier's link is built for it",
    fields: customProviderFields(),
  };
}

/** "Galileo BD!" → "custom-flight-galileo-bd". */
export function customProviderKey(kind: ProviderKind, name: string, attempt = 1): string {
  // The slug may hold 40 characters including a "-2" style suffix for a repeated name (issue 121).
  const suffix = attempt > 1 ? `-${attempt}` : "";
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40 - suffix.length)
    .replace(/-+$/g, "");
  return `custom-${kind}-${slug || "provider"}${suffix}`;
}

// Provider settings: Active, Sandbox or Live, markup (#107) ------------------------------------------------------

export const MarkupTypeSchema = z.enum(["none", "percentage", "fixed"]);
export type MarkupType = z.infer<typeof MarkupTypeSchema>;
export type Markup = { type: MarkupType; value: number };

/** Kinds whose prices can carry a markup or commission rule. */
export const MARKUP_KINDS: readonly ProviderKind[] = ["flight", "hotel"];

export const IntegrationSettingInputSchema = z
  .object({
    isActive: z.boolean(),
    /** true: the production (Live) credentials are used; false: the sandbox (test) ones. */
    isLive: z.boolean(),
    markupType: MarkupTypeSchema.default("none"),
    markupValue: z.number().min(0).max(1_000_000).default(0),
  })
  .strict()
  .refine((value) => value.markupType !== "percentage" || value.markupValue <= 100, {
    path: ["markupValue"],
    message: "A percentage markup is at most 100",
  });

export const CustomProviderInputSchema = z
  .object({
    // Sign-in providers are built one by one; only supplier kinds take custom entries.
    kind: z.enum(SUPPLIER_KINDS),
    name: z.string().trim().min(2, "Enter the supplier's name").max(60),
  })
  .strict();

export const IntegrationSettingViewSchema = z
  .object({
    provider: z.string(),
    kind: ProviderKindSchema,
    name: z.string(),
    custom: z.boolean(),
    isActive: z.boolean(),
    isLive: z.boolean(),
    markupType: MarkupTypeSchema,
    markupValue: z.number(),
    updatedBy: z.string().nullable(),
    updatedAt: IsoDateTimeSchema.nullable(),
  })
  .strict();

export type IntegrationSettingInput = z.infer<typeof IntegrationSettingInputSchema>;
export type CustomProviderInput = z.infer<typeof CustomProviderInputSchema>;
export type IntegrationSettingView = z.infer<typeof IntegrationSettingViewSchema>;

/**
 * What the public site may know (no names of secrets, no keys): for flights and hotels whether a provider is active
 * or the manual quote flow runs; for the rest whether a provider is ready.
 */
export const IntegrationStatusSchema = z
  .object({
    flight: z.object({ mode: z.enum(["provider", "manual"]) }).strict(),
    hotel: z.object({ mode: z.enum(["provider", "manual"]) }).strict(),
    payment: z.object({ ready: z.boolean() }).strict(),
    sms: z.object({ ready: z.boolean() }).strict(),
    email: z.object({ ready: z.boolean() }).strict(),
    auth: z.object({ google: z.boolean() }).strict(),
    /**
     * Values the visitor's browser may hold (issue 284), each null while its service is Off, unsaved or failing its
     * last test. Read by the site at run time, so a change in Admin needs no rebuild.
     */
    public: z
      .object({
        turnstileSiteKey: z.string().nullable(),
        ga4Id: z.string().nullable(),
        gtmId: z.string().nullable(),
        metaPixelId: z.string().nullable(),
        googleVerification: z.string().nullable(),
        bingVerification: z.string().nullable(),
        errorTrackingDsn: z.string().nullable(),
      })
      .strict(),
    /** Features that need an outside service show only when it is On and healthy. */
    features: z
      .object({
        onlinePayment: z.boolean(),
        courierTracking: z.boolean(),
        telegramAlerts: z.boolean(),
        offsiteBackup: z.boolean(),
      })
      .strict(),
  })
  .strict();
export type PublicIntegrations = IntegrationStatus["public"];

/** Everything off: the site's answer before the API is reachable and in fixture mode. */
export const INTEGRATIONS_OFF: IntegrationStatus = {
  flight: { mode: "manual" },
  hotel: { mode: "manual" },
  payment: { ready: false },
  sms: { ready: false },
  email: { ready: false },
  auth: { google: false },
  public: {
    turnstileSiteKey: null,
    ga4Id: null,
    gtmId: null,
    metaPixelId: null,
    googleVerification: null,
    bingVerification: null,
    errorTrackingDsn: null,
  },
  features: {
    onlinePayment: false,
    courierTracking: false,
    telegramAlerts: false,
    offsiteBackup: false,
  },
};
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

const FieldValueSchema = z.string().trim().max(4096);

/** Save a connection: plain settings in full, secrets only when typed (an empty or missing secret keeps the saved one). */
export const ProviderConnectionInputSchema = z
  .object({
    settings: z.record(z.string().min(1).max(40), FieldValueSchema),
    secrets: z.record(z.string().min(1).max(40), FieldValueSchema).default({}),
    note: z.string().trim().max(300).optional(),
  })
  .strict();

export const ProviderHealthSchema = z
  .object({
    ok: z.boolean(),
    message: z.string(),
    at: IsoDateTimeSchema,
  })
  .strict();

/** A saved connection as the admin sees it: secrets reduced to "saved, ends in 1234". */
export const ProviderConnectionViewSchema = z
  .object({
    provider: z.string(),
    environment: ProviderEnvironmentSchema,
    settings: z.record(z.string(), z.string()),
    secrets: z.record(z.string(), z.object({ set: z.boolean(), last4: z.string().nullable() })),
    note: z.string().nullable(),
    health: ProviderHealthSchema.nullable(),
    updatedBy: z.string().nullable(),
    updatedAt: IsoDateTimeSchema,
  })
  .strict();

export type ProviderConnectionInput = z.infer<typeof ProviderConnectionInputSchema>;
export type ProviderHealth = z.infer<typeof ProviderHealthSchema>;
export type ProviderConnectionView = z.infer<typeof ProviderConnectionViewSchema>;

/**
 * Checks a connection's settings and secrets against the catalog: unknown keys are refused, required fields must be
 * present (a secret counts as present when it is already saved), URLs must be https. Returns the problems by field.
 */
export function validateProviderConnection(
  provider: ProviderKey | ProviderDefinition,
  input: Pick<ProviderConnectionInput, "settings" | "secrets">,
  savedSecrets: readonly string[] = [],
): Array<{ path: string; message: string }> {
  const definition = typeof provider === "string" ? providerDefinition(provider) : provider;
  if (!definition) return [{ path: "provider", message: "Unknown provider" }];
  const problems: Array<{ path: string; message: string }> = [];
  const known = new Map(definition.fields.map((field) => [field.key, field]));
  for (const [group, values] of [
    ["settings", input.settings],
    ["secrets", input.secrets],
  ] as const) {
    for (const key of Object.keys(values)) {
      const field = known.get(key);
      if (!field || field.secret !== (group === "secrets"))
        problems.push({ path: `${group}.${key}`, message: "Unknown field for this provider" });
    }
  }
  for (const field of definition.fields) {
    const group = field.secret ? "secrets" : "settings";
    const value = (field.secret ? input.secrets : input.settings)[field.key]?.trim() ?? "";
    const present = value !== "" || (field.secret && savedSecrets.includes(field.key));
    if (field.required && !present)
      problems.push({ path: `${group}.${field.key}`, message: `${field.label} is required` });
    if (field.type === "number" && value !== "" && !/^\d{1,5}$/.test(value))
      problems.push({ path: `${group}.${field.key}`, message: `${field.label} must be a number` });
    if (field.pattern && value !== "" && !new RegExp(field.pattern).test(value))
      problems.push({
        path: `${group}.${field.key}`,
        message: field.patternMessage ?? `${field.label} is not in the right form`,
      });
    if (field.key === "extraHeaders" && value !== "") {
      let headersOk = false;
      try {
        const parsed: unknown = JSON.parse(value);
        headersOk =
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed) &&
          Object.values(parsed).every((header) => typeof header === "string");
      } catch {
        headersOk = false;
      }
      if (!headersOk)
        problems.push({
          path: `${group}.${field.key}`,
          message: 'Use JSON with text values, e.g. {"X-Agency": "WAAFA"}',
        });
    }
    if (field.type === "url" && value !== "") {
      let protocol = "";
      try {
        protocol = new URL(value).protocol;
      } catch {
        protocol = "";
      }
      if (protocol !== "https:")
        problems.push({ path: `${group}.${field.key}`, message: "Use a full https:// address" });
    }
  }
  return problems;
}
