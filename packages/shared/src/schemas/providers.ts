import { z } from "zod";
import { IsoDateTimeSchema } from "./common";

/**
 * External API connections (PRD FR-GS-06 to 08): flight, hotel and payment providers plug in behind the adapter
 * interfaces in the API. Admin › Settings › Integrations saves one connection per provider and environment; secrets
 * are encrypted at rest and never sent back to the browser. Connecting a provider never switches a module to Live
 * (the Golden Switch keeps Live locked until Phase E).
 */

export const ProviderKindSchema = z.enum(["flight", "hotel", "payment"]);
export const ProviderEnvironmentSchema = z.enum(["sandbox", "production"]);

export const PROVIDER_IDS = [
  "sabre",
  "amadeus",
  "travelport",
  "flyhub",
  "bdfare",
  "custom-flight",
  "hotelbeds",
  "custom-hotel",
  "sslcommerz",
  "bkash",
  "nagad",
] as const;
export const ProviderIdSchema = z.enum(PROVIDER_IDS);

export type ProviderKind = z.infer<typeof ProviderKindSchema>;
export type ProviderEnvironment = z.infer<typeof ProviderEnvironmentSchema>;
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export type ProviderField = {
  key: string;
  label: string;
  /** Secrets are encrypted at rest and shown masked; the rest are plain settings. */
  secret: boolean;
  required: boolean;
  /** "url" fields must be full https addresses. */
  type: "text" | "url";
  hint?: string;
};

export type ProviderDefinition = {
  id: ProviderId;
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
  "custom-flight": {
    id: "custom-flight",
    name: "Other flight API",
    kind: "flight",
    summary:
      "Any other consolidator or airline API (a matching adapter is added when the contract lands)",
    fields: [
      text("label", "Supplier name"),
      url("The supplier's API host"),
      text("authHeader", "Auth header name", false, "e.g. Authorization or X-Api-Key"),
      secret("apiKey", "API key or token"),
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
  "custom-hotel": {
    id: "custom-hotel",
    name: "Other hotel API",
    kind: "hotel",
    summary: "Any other hotel supplier API (a matching adapter is added when the contract lands)",
    fields: [
      text("label", "Supplier name"),
      url("The supplier's API host"),
      text("authHeader", "Auth header name", false, "e.g. Authorization or X-Api-Key"),
      secret("apiKey", "API key or token"),
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
};

const FieldValueSchema = z.string().trim().max(4096);

/** Save a connection: plain settings in full, secrets only when typed (an empty or missing secret keeps the saved one). */
export const ProviderConnectionInputSchema = z
  .object({
    enabled: z.boolean(),
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
    provider: ProviderIdSchema,
    environment: ProviderEnvironmentSchema,
    enabled: z.boolean(),
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
  provider: ProviderId,
  input: Pick<ProviderConnectionInput, "settings" | "secrets">,
  savedSecrets: readonly string[] = [],
): Array<{ path: string; message: string }> {
  const definition = PROVIDER_CATALOG[provider];
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
