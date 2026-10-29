import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  ONLINE_GATEWAYS,
  type OnlineGateway,
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
import { MESSAGING, type Messaging } from "../notifications/integrationSms";
import { isSmsGateway, smsAdapter, SmsError } from "../notifications/smsGateways";
import { findTelegramGroups, TelegramError, type TelegramGroup } from "../notifications/telegram";
import type { ProviderAdapter, ProviderContext } from "./adapters";
import { adapterFor, type Fetcher, type PortProbe } from "./catalogAdapters";
import { RevalidateService } from "../revalidate/revalidate.service";
import { lastFour, SecretBox } from "./secretBox";
import { TURNSTILE_VERIFY_URL } from "./serviceChecks";

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
  status: "inactive" | "missing-credentials" | "locked-secrets" | "failing" | "unknown";
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
 * and only opened inside the API to call the provider (never shown again, issue 284). Every change goes to the audit log
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
    @Inject(RevalidateService) private readonly revalidate: RevalidateService,
    @Inject(MESSAGING) private readonly messaging: Messaging,
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
    // One set of values (measurement IDs, DSNs, storage, Telegram): always the Live set (issue 284).
    const isLive = definition.liveOnly ? true : input.isLive;
    if (input.isActive) {
      const environment = environmentOf(isLive);
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
        isLive,
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
    this.changed();
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
    this.changed();
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
    if (definition.liveOnly && environment === "sandbox")
      throw problems.badRequest(`${definition.name} has one set of values: save them as Live`);
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
    this.changed();
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
    this.changed();
    return this.view(next);
  }

  /**
   * "Find my group" on the Telegram card (issue 252): the groups the bot has seen, read with the token typed in the
   * form or, when the field is left empty, the saved one. Throws one plain sentence when Telegram says no.
   */
  async findTelegramGroups(
    staff: StaffPrincipal,
    botToken?: string,
  ): Promise<{ groups: TelegramGroup[] }> {
    let token = botToken?.trim() ?? "";
    if (!token) {
      const row = await this.prisma.providerCredential.findUnique({
        where: { provider_environment: { provider: "telegram", environment: "production" } },
      });
      token = (row && this.context(row)?.secrets.botToken) ?? "";
    }
    if (!token) throw problems.badRequest("Type the bot token first, then press Find my group.");
    try {
      const groups = await findTelegramGroups(token, this.fetcher);
      await this.audit.record({
        actor: staff,
        action: "provider.telegram-groups",
        entity: "provider",
        entityId: "telegram",
        after: { found: groups.length },
      });
      return { groups };
    } catch (error) {
      if (error instanceof TelegramError) throw problems.badRequest(error.message);
      throw error;
    }
  }

  /**
   * A test SMS from an SMS card's saved values (issue 252), on or off, so staff can check the Sender ID before turning
   * it on. Answers the gateway's reason in one plain sentence.
   */
  async sendTestSms(
    staff: StaffPrincipal,
    provider: string,
    environment: ProviderEnvironment,
    phone: string,
  ): Promise<{ ok: boolean; message: string }> {
    if (!isSmsGateway(provider)) throw problems.notFound("No SMS service called " + provider);
    const row = await this.find(provider, environment);
    const context = this.context(row);
    let result: { ok: boolean; message: string };
    if (!context) {
      result = {
        ok: false,
        message: "Saved secrets cannot be opened: PROVIDER_SECRET_KEY changed or is missing",
      };
    } else {
      try {
        await smsAdapter(provider, this.fetcher).send(
          phone,
          "WAAFA test SMS: status messages will come from this sender.",
          context,
        );
        result = {
          ok: true,
          message: "The gateway accepted the test SMS. It should arrive within a minute.",
        };
      } catch (error) {
        result = {
          ok: false,
          message: error instanceof SmsError ? error.message : "The SMS could not be sent.",
        };
      }
    }
    await this.audit.record({
      actor: staff,
      action: "provider.test-sms",
      entity: "provider",
      entityId: `${provider}:${environment}`,
      after: result,
    });
    return result;
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
    this.changed();
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

  /**
   * What the public site may know (#107, issue 284): modes, ready flags and the plain values a browser needs (site
   * key, measurement IDs, verification codes, DSN). Never a secret: only fields listed as public in the catalog.
   */
  /** The address the outside world sees this server at (ipify), so staff can give it to a provider. */
  async serverIp(): Promise<{ ip: string | null }> {
    try {
      const response = await this.fetcher("https://api.ipify.org?format=json", {
        method: "GET",
        signal: AbortSignal.timeout(4_000),
      });
      const body = (await response.json?.().catch(() => null)) as { ip?: unknown } | null;
      const ip =
        typeof body?.ip === "string" && /^[d.:a-fA-F]{3,45}$/.test(body.ip) ? body.ip : null;
      return { ip };
    } catch {
      return { ip: null };
    }
  }

  /**
   * Gateways taking real payments (issue 251): on, in Live mode and with Live keys. Checkout offers only these, so a
   * sandbox never takes a customer's money and nothing shows until the owner's keys are saved.
   */
  async liveGateways(): Promise<OnlineGateway[]> {
    const live: OnlineGateway[] = [];
    for (const gateway of ONLINE_GATEWAYS) {
      const config = await this.getIntegrationConfig("payment", gateway);
      if (config.status === "ready" && config.environment === "production") live.push(gateway);
    }
    return live;
  }

  async publicStatus(): Promise<IntegrationStatus> {
    const [flight, hotel, payment, sms, email, courier, storage] = await Promise.all(
      (["flight", "hotel", "payment", "sms", "email", "courier", "storage"] as const).map((kind) =>
        this.resolveCategory(kind),
      ),
    );
    const [google, telegram] = await Promise.all([
      this.getIntegrationConfig("auth", "google"),
      this.getIntegrationConfig("alerts", "telegram"),
    ]);
    const value = async (kind: ProviderKind, provider: string, field: string) => {
      const config = await this.getIntegrationConfig(kind, provider);
      const allowed = providerDefinition(provider)?.publicFields?.includes(field) ?? false;
      return config.status === "ready" && allowed ? (config.settings[field] ?? null) : null;
    };
    const [turnstile, ga4, gtm, pixel, googleCode, bingCode, sentry, glitchtip] = await Promise.all(
      [
        value("captcha", "turnstile", "siteKey"),
        value("analytics", "ga4", "measurementId"),
        value("analytics", "gtm", "containerId"),
        value("analytics", "meta-pixel", "pixelId"),
        value("analytics", "search-console", "token"),
        value("analytics", "bing", "token"),
        value("monitoring", "sentry", "dsn"),
        value("monitoring", "glitchtip", "dsn"),
      ],
    );
    return {
      flight: { mode: flight?.mode === "provider" ? "provider" : "manual" },
      hotel: { mode: hotel?.mode === "provider" ? "provider" : "manual" },
      payment: { ready: payment?.mode === "provider", gateways: await this.liveGateways() },
      sms: { ready: sms?.mode === "provider" },
      email: { ready: email?.mode === "provider" },
      auth: { google: google.status === "ready" },
      public: {
        turnstileSiteKey: turnstile,
        ga4Id: ga4,
        gtmId: gtm,
        metaPixelId: pixel,
        googleVerification: googleCode,
        bingVerification: bingCode,
        errorTrackingDsn: sentry ?? glitchtip,
      },
      features: {
        onlinePayment: payment?.mode === "provider",
        courierTracking: courier?.mode === "provider",
        telegramAlerts: telegram.status === "ready",
        offsiteBackup: storage?.mode === "provider",
      },
    };
  }

  /**
   * Cloudflare Turnstile for a public form (issue 284): the web server sends the visitor's token here, so the secret
   * stays in the API. While Turnstile is off (or not saved) every token passes, as before.
   */
  async verifyTurnstile(
    token: string,
    ip: string | undefined,
  ): Promise<{ ok: boolean; checked: boolean }> {
    const config = await this.getIntegrationConfig("captcha", "turnstile");
    if (config.status !== "ready") return { ok: true, checked: false };
    if (!token) return { ok: false, checked: true };
    const body = new URLSearchParams({ secret: config.secrets.secretKey ?? "", response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    try {
      const response = await this.fetcher(TURNSTILE_VERIFY_URL, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(5_000),
      });
      const result = ((await response.json?.()) ?? {}) as { success?: boolean };
      return { ok: result.success === true, checked: true };
    } catch {
      return { ok: false, checked: true };
    }
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

  /** The site reads the public part at run time: expire its cache so a change shows without a redeploy (issue 284). */
  private changed(): void {
    this.revalidate.request(["integrations"]);
    // SMS and Telegram read the cards that are on through a one-minute cache (issue 252).
    this.messaging.active.clear();
  }

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
    // A failing last test keeps the service out of use until a test passes (issue 284); untested saves are used.
    if (row.healthOk === false) {
      return {
        status: "failing",
        provider: setting.provider,
        message: `${definition.name} failed its last test: ${row.healthMessage ?? "no answer"}`,
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
