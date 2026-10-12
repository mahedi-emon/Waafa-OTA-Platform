import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

/**
 * External API connections (PRD FR-GS-06 to 08, #82, #107): flight, hotel, payment, SMS and email providers plug in
 * behind the adapter interfaces in the API. Admin › Settings › Integrations keeps one setting per provider (Active,
 * Sandbox or Live credentials, markup) and one credential set per environment; secrets are encrypted at rest and only
 * leave the API through the audited reveal. Connecting a provider never switches a module to Live (the Golden Switch
 * keeps Live locked until Phase E).
 */

/** "auth": customer sign-in providers (Google, issue 134); no custom ones, the sign-in flow is built per provider. */
export const ProviderKindSchema = z.enum(["flight", "hotel", "payment", "sms", "email", "auth"]);
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
};

export type ProviderDefinition = {
  id: ProviderKey;
  name: string;
  kind: ProviderKind;
  summary: string;
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

/** Every provider the API has an adapter (or a contract-tested stub) for. */
export const PROVIDER_CATALOG: Record<ProviderId, ProviderDefinition> = {
  sabre: {
    id: "sabre",
    name: "Sabre",
    kind: "flight",
    summary: "GDS: search, PNR, ticketing",
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
    summary: "GDS: search, PNR, ticketing",
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
    summary: "GDS: search, PNR, ticketing",
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
    summary: "Consolidator API: search, booking, ticket issue",
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
    summary: "Consolidator API: search, booking, ticket issue",
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
    summary: "Hotel API: availability, rates, booking",
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
    summary: "Added in Admin; the adapter is installed when the supplier contract lands",
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
    kind: ProviderKindSchema.exclude(["auth"]),
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
  })
  .strict();
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
