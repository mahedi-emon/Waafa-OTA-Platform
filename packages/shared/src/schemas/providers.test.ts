import { describe, expect, it } from "vitest";
import {
  CustomProviderInputSchema,
  IntegrationSettingInputSchema,
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  ProviderConnectionInputSchema,
  ProviderKeySchema,
  customProviderKey,
  customProviderKind,
  providerDefinition,
  validateProviderConnection,
} from "./providers";

describe("provider catalog", () => {
  it("has one definition per id, each with an address and at least one secret", () => {
    for (const id of PROVIDER_IDS) {
      const definition = PROVIDER_CATALOG[id];
      expect(definition.id).toBe(id);
      // HTTP APIs have a base URL; SMTP has a host and port instead.
      const address = id === "smtp" ? "host" : "baseUrl";
      expect(definition.fields.some((field) => field.key === address)).toBe(true);
      expect(definition.fields.some((field) => field.secret)).toBe(true);
      const keys = definition.fields.map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("covers the PRD providers: three GDS, consolidators, hotels and three payment gateways", () => {
    const kinds = PROVIDER_IDS.map((id) => PROVIDER_CATALOG[id].kind);
    expect(kinds.filter((kind) => kind === "flight").length).toBeGreaterThanOrEqual(5);
    expect(kinds).toContain("hotel");
    expect(["sslcommerz", "bkash", "nagad"].every((id) => PROVIDER_IDS.includes(id as never))).toBe(
      true,
    );
  });

  it("covers SMS and email (#107)", () => {
    const kinds = PROVIDER_IDS.map((id) => PROVIDER_CATALOG[id].kind);
    expect(kinds.filter((kind) => kind === "sms").length).toBeGreaterThanOrEqual(2);
    expect(kinds.filter((kind) => kind === "email")).toHaveLength(2);
  });
});

describe("custom providers (#107)", () => {
  it("builds keys from the kind and name", () => {
    expect(customProviderKey("flight", "Galileo BD!")).toBe("custom-flight-galileo-bd");
    expect(customProviderKey("sms", "  ")).toBe("custom-sms-provider");
    expect(customProviderKey("hotel", "x".repeat(80))).toHaveLength("custom-hotel-".length + 40);
    // Repeated long names keep a valid key (issue 121).
    const second = customProviderKey("flight", "Long supplier name for testing keys".repeat(3), 2);
    expect(second.endsWith("-2")).toBe(true);
    expect(ProviderKeySchema.safeParse(second).success).toBe(true);
    expect(ProviderKeySchema.safeParse(customProviderKey("sms", "a".repeat(60), 12)).success).toBe(
      true,
    );
  });

  it("accepts catalog ids and custom keys, nothing else", () => {
    expect(ProviderKeySchema.safeParse("amadeus").success).toBe(true);
    expect(ProviderKeySchema.safeParse("custom-payment-upay").success).toBe(true);
    expect(ProviderKeySchema.safeParse("custom-hajj-x").success).toBe(false);
    expect(ProviderKeySchema.safeParse("../etc").success).toBe(false);
    expect(customProviderKind("custom-email-zoho")).toBe("email");
  });

  it("gives custom providers generic fields with their saved name", () => {
    const definition = providerDefinition("custom-flight-galileo-bd", "Galileo BD");
    expect(definition?.name).toBe("Galileo BD");
    expect(definition?.kind).toBe("flight");
    expect(definition?.fields.map((field) => field.key)).toContain("apiKey");
    expect(providerDefinition("nope")).toBeNull();
  });

  it("checks extra headers are JSON with text values", () => {
    const base = { baseUrl: "https://api.example.com" };
    const secrets = { apiKey: "k" };
    expect(
      validateProviderConnection("custom-flight-x1", {
        settings: { ...base, extraHeaders: '{"X-Agency":"WAAFA"}' },
        secrets,
      }),
    ).toEqual([]);
    expect(
      validateProviderConnection("custom-flight-x1", {
        settings: { ...base, extraHeaders: "[1]" },
        secrets,
      }).map((problem) => problem.path),
    ).toEqual(["settings.extraHeaders"]);
  });

  it("needs a numeric SMTP port", () => {
    const problems = validateProviderConnection("smtp", {
      settings: { host: "smtp.example.com", port: "abc", username: "u", from: "a@b.co" },
      secrets: { password: "p" },
    });
    expect(problems).toEqual([{ path: "settings.port", message: "Port must be a number" }]);
  });

  it("parses settings and custom provider input", () => {
    expect(
      IntegrationSettingInputSchema.safeParse({
        isActive: true,
        isLive: false,
        markupType: "percentage",
        markupValue: 120,
      }).success,
    ).toBe(false);
    expect(IntegrationSettingInputSchema.parse({ isActive: false, isLive: true })).toEqual({
      isActive: false,
      isLive: true,
      markupType: "none",
      markupValue: 0,
    });
    expect(CustomProviderInputSchema.safeParse({ kind: "sms", name: "A" }).success).toBe(false);
  });
});

describe("validateProviderConnection", () => {
  const complete = {
    settings: { baseUrl: "https://api.example.com", clientId: "abc", pcc: "X1Y2" },
    secrets: { clientSecret: "s3cret" },
  };

  it("accepts a complete connection", () => {
    expect(validateProviderConnection("sabre", complete)).toEqual([]);
  });

  it("lists missing required fields", () => {
    const problems = validateProviderConnection("sabre", { settings: {}, secrets: {} });
    expect(problems.map((problem) => problem.path)).toEqual([
      "settings.baseUrl",
      "settings.clientId",
      "secrets.clientSecret",
      "settings.pcc",
    ]);
  });

  it("keeps a saved secret when the field is left empty", () => {
    const input = { ...complete, secrets: { clientSecret: "" } };
    expect(validateProviderConnection("sabre", input)).toHaveLength(1);
    expect(validateProviderConnection("sabre", input, ["clientSecret"])).toEqual([]);
  });

  it("refuses unknown keys and secrets sent as plain settings", () => {
    const problems = validateProviderConnection("sabre", {
      settings: { ...complete.settings, clientSecret: "leak", extra: "x" },
      secrets: complete.secrets,
    });
    expect(problems.map((problem) => problem.path)).toEqual([
      "settings.clientSecret",
      "settings.extra",
    ]);
  });

  it("needs https addresses", () => {
    for (const baseUrl of ["http://api.example.com", "api.example.com", "ftp://x"]) {
      const problems = validateProviderConnection("sabre", {
        ...complete,
        settings: { ...complete.settings, baseUrl },
      });
      expect(problems).toEqual([
        { path: "settings.baseUrl", message: "Use a full https:// address" },
      ]);
    }
  });

  it("parses the input with secrets optional", () => {
    const parsed = ProviderConnectionInputSchema.parse({ settings: { a: " b " } });
    expect(parsed).toEqual({ settings: { a: "b" }, secrets: {} });
  });
});
