import { describe, expect, it } from "vitest";
import {
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  ProviderConnectionInputSchema,
  validateProviderConnection,
} from "./providers";

describe("provider catalog", () => {
  it("has one definition per id, each with a base URL and at least one secret", () => {
    for (const id of PROVIDER_IDS) {
      const definition = PROVIDER_CATALOG[id];
      expect(definition.id).toBe(id);
      expect(definition.fields.some((field) => field.key === "baseUrl")).toBe(true);
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
    const parsed = ProviderConnectionInputSchema.parse({ enabled: true, settings: { a: " b " } });
    expect(parsed).toEqual({ enabled: true, settings: { a: "b" }, secrets: {} });
  });
});
