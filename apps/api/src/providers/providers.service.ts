import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  MARKUP_KINDS,
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  customProviderKey,
  isCustomProvider,
  providerDefinition,
  toDhakaIsoString,
  validateProviderConnection,
  type CustomProviderInput,
  type IntegrationSettingInput,
  type IntegrationSettingView,
  type IntegrationStatus,
  type Markup,
  type MarkupType,
  type ProviderConnectionInput,
  type ProviderConnectionView,
  type ProviderDefinition,
  type ProviderEnvironment,
  type ProviderKey,
  type ProviderKind,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { ENV, type Env } from "../config/env";
import { ProblemException, problems } from "../common/problem";
import type { IntegrationSetting, ProviderCredential } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { ProviderAdapter, ProviderContext } from "./adapters";
import { adapterFor, type Fetcher, type PortProbe } from "./catalogAdapters";
import { lastFour, SecretBox } from "./secretBox";

export const PROVIDER_FETCH = Symbol("PROVIDER_FETCH");
export const PROVIDER_PROBE = Symbol("PROVIDER_PROBE");

type Sealed = Record<string, string>;

/** A provider ready for server-side calls: credentials opened, never sent to a browser. */
export type IntegrationConfig = {
  status: "ready";
  provider: ProviderKey;
  name: string;
  kind: ProviderKind;
  environment: ProviderEnvironment;
  settings: Readonly<Record<string, string>>;
  secrets: Readonly<Record<string, string>>;
  markup: Markup;
};

/** Why a provider cannot be used right now. */
export type IntegrationUnavailable = {
  status: "inactive" | "missing-credentials" | "locked-secrets" | "unknown";
  provider: string;
  message: string;
};

/** Flights and hotels with no ready provider keep the manual quote flow (FR-GS-01). */
export type CategoryResolution =
  { mode: "provider"; providers: IntegrationConfig[] } | { mode: "manual"; reason: string };

const environmentOf = (isLive: boolean): ProviderEnvironment => (isLive ? "production" : "sandbox");

/**
 * External API connections (#82, #107): the Super Admin adds providers, saves credentials per environment, turns
 * providers on and off, picks Sandbox or Live credentials and sets the markup. Secrets are sealed with AES-256-GCM
 * and only opened inside the API to call the provider, or for the audited reveal. Every change goes to the audit log
 * without secret values.
 */
@Injectable()
export class ProvidersService {
  private readonly box: SecretBox | null;

  constructor(
    @Inject(ENV) env: Env,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PROVIDER_FETCH) private readonly fetcher: Fetcher,
    @Inject(PROVIDER_PROBE) private readonly probe: PortProbe,
  ) {
    this.box = env.PROVIDER_SECRET_KEY ? new SecretBox(env.PROVIDER_SECRET_KEY) : null;
  }

  async list() {
    const [rows, settings] = await Promise.all([
      this.prisma.providerCredential.findMany({ orderBy: { provider: "asc" } }),
      this.prisma.integrationSetting.findMany({ orderBy: { name: "asc" } }),
    ]);
    const byProvider = new Map(settings.map((setting) => [setting.provider, setting]));
    const catalog: ProviderDefinition[] = [
      ...PROVIDER_IDS.map((id) => PROVIDER_CATALOG[id]),
      ...settings
        .filter((setting) => setting.custom)
        .flatMap((setting) => {
          const definition = providerDefinition(setting.provider, setting.name);
          return definition ? [definition] : [];
        }),
    ];
    return {
      encryptionReady: this.box !== null,
      catalog,
      settings: catalog.map((definition) =>
        this.settingView(definition, byProvider.get(definition.id)),
      ),
      connections: rows.map((row) => this.view(row)),
    };
  }

  // Provider settings --------------------------------------------------------------------------------------------

  async addCustom(
    staff: StaffPrincipal,
    input: CustomProviderInput,
  ): Promise<IntegrationSettingView> {
    let key = customProviderKey(input.kind, input.name);
    for (
      let attempt = 2;
      await this.prisma.integrationSetting.findUnique({ where: { provider: key } });
      attempt++
    ) {
      if (attempt > 50) throw problems.conflict("Choose another name for this provider");
      // The suffix replaces the end of the slug, so the key always matches ProviderKeySchema (issue 121).
      key = customProviderKey(input.kind, input.name, attempt);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.integrationSetting.create({
        data: {
          provider: key,
          kind: input.kind,
          name: input.name,
          custom: true,
          updatedBy: staff.name,
        },
      });
      await this.audit.record(
        {
          actor: staff,
          action: "integration.add",
          entity: "integration",
          entityId: key,
          after: { kind: input.kind, name: input.name },
        },
        tx,
      );
      return created;
    });
    const definition = providerDefinition(row.provider, row.name);
    if (!definition) throw problems.badRequest("Unknown provider");
    return this.settingView(definition, row);
  }

  async saveSetting(
    staff: StaffPrincipal,
    provider: string,
    input: IntegrationSettingInput,
  ): Promise<IntegrationSettingView> {
    const existing = await this.prisma.integrationSetting.findUnique({ where: { provider } });
    const definition = this.definitionOrThrow(provider, existing);
    const markupAllowed = MARKUP_KINDS.includes(definition.kind);
    const markupType: MarkupType = markupAllowed ? input.markupType : "none";
    const markupValue = markupType === "none" ? 0 : input.markupValue;
    if (input.isActive) {
      const environment = environmentOf(input.isLive);
      const credential = await this.prisma.providerCredential.findUnique({
        where: { provider_environment: { provider, environment } },
      });
      if (!credential) {
        throw new ProblemException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "Validation failed",
          `Save the ${environment === "production" ? "Live" : "Sandbox"} credentials before turning ${definition.name} on`,
          [{ path: "isActive", message: "Credentials for this mode are not saved" }],
        );
      }
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const data = {
        isActive: input.isActive,
        isLive: input.isLive,
        markupType,
        markupValue,
        updatedBy: staff.name,
      };
      const next = await tx.integrationSetting.upsert({
        where: { provider },
        create: { provider, kind: definition.kind, name: definition.name, ...data },
        update: data,
      });
      await this.audit.record(
        {
          actor: staff,
          action: "integration.update",
          entity: "integration",
          entityId: provider,
          before: existing
            ? {
                isActive: existing.isActive,
                isLive: existing.isLive,
                markupType: existing.markupType,
                markupValue: Number(existing.markupValue),
              }
            : undefined,
          after: data,
        },
        tx,
      );
      return next;
    });
    return this.settingView(definition, row);
  }

  /** Deletes an admin-added provider with its saved credentials. Catalog providers can only be turned off. */
  async removeCustom(staff: StaffPrincipal, provider: string) {
    if (!isCustomProvider(provider))
      throw problems.badRequest("Catalog providers can be turned off, not removed");
    const existing = await this.prisma.integrationSetting.findUnique({ where: { provider } });
    if (!existing) throw problems.notFound("This provider is not saved");
    await this.prisma.$transaction(async (tx) => {
      await tx.providerCredential.deleteMany({ where: { provider } });
      await tx.integrationSetting.delete({ where: { provider } });
      await this.audit.record(
        {
          actor: staff,
          action: "integration.remove",
          entity: "integration",
          entityId: provider,
          before: { kind: existing.kind, name: existing.name, isActive: existing.isActive },
        },
        tx,
      );
    });
  }

  // Credentials per environment ----------------------------------------------------------------------------------

  async save(
    staff: StaffPrincipal,
    provider: string,
    environment: ProviderEnvironment,
    input: ProviderConnectionInput,
  ): Promise<ProviderConnectionView> {
    const setting = await this.prisma.integrationSetting.findUnique({ where: { provider } });
    const definition = this.definitionOrThrow(provider, setting);
    const existing = await this.prisma.providerCredential.findUnique({
      where: { provider_environment: { provider, environment } },
    });
    const saved = (existing?.secrets ?? {}) as Sealed;
    const fields = validateProviderConnection(definition, input, Object.keys(saved));
    if (fields.length > 0) {
      throw new ProblemException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Validation failed",
        "Some fields are missing or invalid",
        fields,
      );
    }
    const typed = Object.entries(input.secrets).filter(([, value]) => value.trim() !== "");
    const secrets: Sealed = { ...saved };
    if (typed.length > 0) {
      const box = this.box;
      if (!box) {
        throw problems.conflict(
          "Set PROVIDER_SECRET_KEY on the server before saving API secrets",
          "no-encryption-key",
        );
      }
      for (const [key, value] of typed) secrets[key] = box.seal(value.trim());
    }
    const settings = Object.fromEntries(
      Object.entries(input.settings).filter(([, value]) => value !== ""),
    );
    const row = await this.prisma.$transaction(async (tx) => {
      const data = {
        settings,
        secrets,
        note: input.note ?? existing?.note ?? null,
        updatedBy: staff.name,
        // A changed connection needs a fresh test.
        healthOk: null,
        healthMessage: null,
        healthAt: null,
      };
      const next = await tx.providerCredential.upsert({
        where: { provider_environment: { provider, environment } },
        create: { provider, environment, ...data },
        update: data,
      });
      // Catalog providers get their setting row (off, Sandbox) on the first save.
      await tx.integrationSetting.upsert({
        where: { provider },
        create: { provider, kind: definition.kind, name: definition.name, updatedBy: staff.name },
        update: {},
      });
      await this.audit.record(
        {
          actor: staff,
          action: existing ? "provider.update" : "provider.connect",
          entity: "provider",
          entityId: `${provider}:${environment}`,
          before: existing ? { settings: existing.settings } : undefined,
          after: { settings, secretsChanged: typed.map(([key]) => key) },
        },
        tx,
      );
      return next;
    });
    return this.view(row);
  }

  async test(
    staff: StaffPrincipal,
    provider: string,
    environment: ProviderEnvironment,
    now = new Date(),
  ): Promise<ProviderConnectionView> {
    const row = await this.find(provider, environment);
    const setting = await this.prisma.integrationSetting.findUnique({ where: { provider } });
    const definition = this.definitionOrThrow(provider, setting);
    const context = this.context(row);
    const result = context
      ? await this.adapter(definition).healthCheck(context)
      : {
          ok: false,
          message: "Saved secrets cannot be opened: PROVIDER_SECRET_KEY changed or is missing",
        };
    const next = await this.prisma.providerCredential.update({
      where: { id: row.id },
      data: { healthOk: result.ok, healthMessage: result.message.slice(0, 300), healthAt: now },
    });
    await this.audit.record({
      actor: staff,
      action: "provider.test",
      entity: "provider",
      entityId: `${provider}:${environment}`,
      after: result,
    });
    return this.view(next);
  }

  /**
   * Shows one saved secret to the Super Admin (#107). The value is returned once, never stored in a log; the audit
   * entry records who looked at which field and when.
   */
  async reveal(
    staff: StaffPrincipal,
    provider: string,
    environment: ProviderEnvironment,
    field: string,
  ): Promise<{ field: string; value: string }> {
    const row = await this.find(provider, environment);
    const sealed = (row.secrets as Sealed)[field];
    if (!sealed) throw problems.notFound("This secret is not saved");
    if (!this.box)
      throw problems.conflict("PROVIDER_SECRET_KEY is missing on the server", "no-encryption-key");
    let value: string;
    try {
      value = this.box.open(sealed);
    } catch {
      throw problems.conflict(
        "The saved secret cannot be opened: PROVIDER_SECRET_KEY changed",
        "locked-secret",
      );
    }
    await this.audit.record({
      actor: staff,
      action: "provider.reveal",
      entity: "provider",
      entityId: `${provider}:${environment}`,
      after: { field },
    });
    return { field, value };
  }

  async remove(staff: StaffPrincipal, provider: string, environment: ProviderEnvironment) {
    const row = await this.find(provider, environment);
    const setting = await this.prisma.integrationSetting.findUnique({ where: { provider } });
    await this.prisma.$transaction(async (tx) => {
      await tx.providerCredential.delete({ where: { id: row.id } });
      // The provider cannot stay on without the credentials of its current mode.
      if (setting?.isActive && environmentOf(setting.isLive) === environment) {
        await tx.integrationSetting.update({ where: { provider }, data: { isActive: false } });
      }
      await this.audit.record(
        {
          actor: staff,
          action: "provider.remove",
          entity: "provider",
          entityId: `${provider}:${environment}`,
          before: { settings: row.settings },
        },
        tx,
      );
    });
  }

  // Server-side use: helpers for API calls ------------------------------------------------------------------------

  /**
   * The credentials to call one provider with (#107), or why it cannot be used. Uses the Live credentials when the
   * provider is set to Live, the Sandbox ones otherwise. Server only: the result holds opened secrets.
   */
  async getIntegrationConfig(
    kind: ProviderKind,
    provider: string,
  ): Promise<IntegrationConfig | IntegrationUnavailable> {
    const setting = await this.prisma.integrationSetting.findUnique({ where: { provider } });
    const definition = providerDefinition(provider, setting?.name);
    if (!definition || definition.kind !== kind) {
      return { status: "unknown", provider, message: `No ${kind} provider called ${provider}` };
    }
    if (!setting?.isActive) {
      return { status: "inactive", provider, message: `${definition.name} is turned off` };
    }
    return this.configFor(definition, setting);
  }

  /**
   * Every ready provider of one kind. Flights and hotels with none fall back to the manual quote flow, so the site
   * keeps taking requests that an expert confirms (FR-GS-01).
   */
  async resolveCategory(kind: ProviderKind): Promise<CategoryResolution> {
    const settings = await this.prisma.integrationSetting.findMany({
      where: { kind, isActive: true },
      orderBy: { name: "asc" },
    });
    const ready: IntegrationConfig[] = [];
    for (const setting of settings) {
      const definition = providerDefinition(setting.provider, setting.name);
      if (!definition) continue;
      const config = await this.configFor(definition, setting);
      if (config.status === "ready") ready.push(config);
    }
    if (ready.length > 0) return { mode: "provider", providers: ready };
    return {
      mode: "manual",
      reason:
        settings.length === 0
          ? `No ${kind} provider is active`
          : `The active ${kind} providers have no usable credentials`,
    };
  }

  /** What the public site may know: no names, no keys (#107). */
  async publicStatus(): Promise<IntegrationStatus> {
    const [flight, hotel, payment, sms, email] = await Promise.all(
      (["flight", "hotel", "payment", "sms", "email"] as const).map((kind) =>
        this.resolveCategory(kind),
      ),
    );
    const google = await this.getIntegrationConfig("auth", "google");
    return {
      flight: { mode: flight?.mode === "provider" ? "provider" : "manual" },
      hotel: { mode: hotel?.mode === "provider" ? "provider" : "manual" },
      payment: { ready: payment?.mode === "provider" },
      sms: { ready: sms?.mode === "provider" },
      email: { ready: email?.mode === "provider" },
      auth: { google: google.status === "ready" },
    };
  }

  /**
   * The active connections of one kind with their adapters, for the registry. Connecting never switches a module to
   * Live: the Golden Switch decides.
   */
  async active(
    kind: ProviderKind,
  ): Promise<Array<{ adapter: ProviderAdapter; context: ProviderContext }>> {
    const resolution = await this.resolveCategory(kind);
    if (resolution.mode === "manual") return [];
    return resolution.providers.flatMap((config) => {
      const definition = providerDefinition(config.provider, config.name);
      return definition
        ? [
            {
              adapter: this.adapter(definition),
              context: {
                environment: config.environment,
                settings: config.settings,
                secrets: config.secrets,
              },
            },
          ]
        : [];
    });
  }

  // Internals ----------------------------------------------------------------------------------------------------

  private adapter(definition: ProviderDefinition): ProviderAdapter {
    return adapterFor(definition, this.fetcher, this.probe);
  }

  private async configFor(
    definition: ProviderDefinition,
    setting: IntegrationSetting,
  ): Promise<IntegrationConfig | IntegrationUnavailable> {
    const environment = environmentOf(setting.isLive);
    const row = await this.prisma.providerCredential.findUnique({
      where: { provider_environment: { provider: setting.provider, environment } },
    });
    if (!row) {
      return {
        status: "missing-credentials",
        provider: setting.provider,
        message: `${definition.name} has no ${environment === "production" ? "Live" : "Sandbox"} credentials`,
      };
    }
    const context = this.context(row);
    if (!context) {
      return {
        status: "locked-secrets",
        provider: setting.provider,
        message: "Saved secrets cannot be opened: PROVIDER_SECRET_KEY changed or is missing",
      };
    }
    return {
      status: "ready",
      provider: setting.provider,
      name: definition.name,
      kind: definition.kind,
      environment,
      settings: context.settings,
      secrets: context.secrets,
      markup: { type: setting.markupType as MarkupType, value: Number(setting.markupValue) },
    };
  }

  private definitionOrThrow(
    provider: string,
    setting: IntegrationSetting | null,
  ): ProviderDefinition {
    if (isCustomProvider(provider) && !setting) throw problems.notFound("Add this provider first");
    const definition = providerDefinition(provider, setting?.name);
    if (!definition) throw problems.notFound("Unknown provider");
    return definition;
  }

  private async find(provider: string, environment: ProviderEnvironment) {
    const row = await this.prisma.providerCredential.findUnique({
      where: { provider_environment: { provider, environment } },
    });
    if (!row) throw problems.notFound("This connection is not saved");
    return row;
  }

  /** Opens the secrets; null when they cannot be opened (key missing or changed). */
  private context(row: ProviderCredential): ProviderContext | null {
    const sealed = row.secrets as Sealed;
    try {
      const secrets = Object.fromEntries(
        Object.entries(sealed).map(([key, value]) => [key, this.box ? this.box.open(value) : ""]),
      );
      if (!this.box && Object.keys(sealed).length > 0) return null;
      return {
        environment: row.environment as ProviderEnvironment,
        settings: row.settings as Record<string, string>,
        secrets,
      };
    } catch {
      return null;
    }
  }

  private settingView(
    definition: ProviderDefinition,
    row: IntegrationSetting | undefined,
  ): IntegrationSettingView {
    return {
      provider: definition.id,
      kind: definition.kind,
      name: row?.custom ? row.name : definition.name,
      custom: row?.custom ?? false,
      isActive: row?.isActive ?? false,
      isLive: row?.isLive ?? false,
      markupType: (row?.markupType ?? "none") as MarkupType,
      markupValue: row ? Number(row.markupValue) : 0,
      updatedBy: row?.updatedBy ?? null,
      updatedAt: row ? toDhakaIsoString(row.updatedAt) : null,
    };
  }

  private view(row: ProviderCredential): ProviderConnectionView {
    const sealed = row.secrets as Sealed;
    const secrets: ProviderConnectionView["secrets"] = {};
    for (const [key, value] of Object.entries(sealed)) {
      let last4: string | null = null;
      try {
        last4 = this.box ? lastFour(this.box.open(value)) : null;
      } catch {
        last4 = null;
      }
      secrets[key] = { set: true, last4 };
    }
    return {
      provider: row.provider,
      environment: row.environment as ProviderEnvironment,
      settings: row.settings as Record<string, string>,
      secrets,
      note: row.note,
      health:
        row.healthAt && row.healthOk !== null
          ? {
              ok: row.healthOk,
              message: row.healthMessage ?? "",
              at: toDhakaIsoString(row.healthAt),
            }
          : null,
      updatedBy: row.updatedBy,
      updatedAt: toDhakaIsoString(row.updatedAt),
    };
  }
}
