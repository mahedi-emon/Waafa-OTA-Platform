import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  PROVIDER_CATALOG,
  PROVIDER_IDS,
  toDhakaIsoString,
  validateProviderConnection,
  type ProviderConnectionInput,
  type ProviderConnectionView,
  type ProviderEnvironment,
  type ProviderId,
  type ProviderKind,
} from "@waafa/shared";
import { AuditService } from "../audit/audit.service";
import type { StaffPrincipal } from "../auth/principal";
import { ENV, type Env } from "../config/env";
import { ProblemException, problems } from "../common/problem";
import type { ProviderCredential } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { ProviderAdapter, ProviderContext } from "./adapters";
import { adapterFor, type Fetcher } from "./catalogAdapters";
import { lastFour, SecretBox } from "./secretBox";

export const PROVIDER_FETCH = Symbol("PROVIDER_FETCH");

type Sealed = Record<string, string>;

/**
 * External API connections (#82): Super Admin saves, tests and removes them; secrets are sealed with AES-256-GCM and
 * only ever opened inside the API to call the provider. Every change goes to the audit log without secret values.
 */
@Injectable()
export class ProvidersService {
  private readonly box: SecretBox | null;

  constructor(
    @Inject(ENV) env: Env,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PROVIDER_FETCH) private readonly fetcher: Fetcher,
  ) {
    this.box = env.PROVIDER_SECRET_KEY ? new SecretBox(env.PROVIDER_SECRET_KEY) : null;
  }

  async list() {
    const rows = await this.prisma.providerCredential.findMany({ orderBy: { provider: "asc" } });
    return {
      encryptionReady: this.box !== null,
      catalog: PROVIDER_IDS.map((id) => PROVIDER_CATALOG[id]),
      connections: rows.map((row) => this.view(row)),
    };
  }

  async save(
    staff: StaffPrincipal,
    provider: ProviderId,
    environment: ProviderEnvironment,
    input: ProviderConnectionInput,
  ): Promise<ProviderConnectionView> {
    const existing = await this.prisma.providerCredential.findUnique({
      where: { provider_environment: { provider, environment } },
    });
    const saved = (existing?.secrets ?? {}) as Sealed;
    const fields = validateProviderConnection(provider, input, Object.keys(saved));
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
        enabled: input.enabled,
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
      await this.audit.record(
        {
          actor: staff,
          action: existing ? "provider.update" : "provider.connect",
          entity: "provider",
          entityId: `${provider}:${environment}`,
          before: existing ? { enabled: existing.enabled, settings: existing.settings } : undefined,
          after: { enabled: input.enabled, settings, secretsChanged: typed.map(([key]) => key) },
        },
        tx,
      );
      return next;
    });
    return this.view(row);
  }

  async test(
    staff: StaffPrincipal,
    provider: ProviderId,
    environment: ProviderEnvironment,
    now = new Date(),
  ): Promise<ProviderConnectionView> {
    const row = await this.find(provider, environment);
    const context = this.context(row);
    const result = context
      ? await adapterFor(provider, this.fetcher).healthCheck(context)
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

  async remove(staff: StaffPrincipal, provider: ProviderId, environment: ProviderEnvironment) {
    const row = await this.find(provider, environment);
    await this.prisma.$transaction(async (tx) => {
      await tx.providerCredential.delete({ where: { id: row.id } });
      await this.audit.record(
        {
          actor: staff,
          action: "provider.remove",
          entity: "provider",
          entityId: `${provider}:${environment}`,
          before: { enabled: row.enabled, settings: row.settings },
        },
        tx,
      );
    });
  }

  /**
   * The enabled connections of one kind with their secrets opened, for the registry. Production connections win over
   * sandbox ones for the same provider. Connecting never switches a module to Live: the Golden Switch decides.
   */
  async active(
    kind: ProviderKind,
  ): Promise<Array<{ adapter: ProviderAdapter; context: ProviderContext }>> {
    const rows = await this.prisma.providerCredential.findMany({ where: { enabled: true } });
    const chosen = new Map<string, ProviderCredential>();
    for (const row of rows) {
      const definition = PROVIDER_CATALOG[row.provider as ProviderId];
      if (definition?.kind !== kind) continue;
      const current = chosen.get(row.provider);
      if (!current || row.environment === "production") chosen.set(row.provider, row);
    }
    return [...chosen.values()].flatMap((row) => {
      const context = this.context(row);
      return context
        ? [{ adapter: adapterFor(row.provider as ProviderId, this.fetcher), context }]
        : [];
    });
  }

  private async find(provider: ProviderId, environment: ProviderEnvironment) {
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
      provider: row.provider as ProviderId,
      environment: row.environment as ProviderEnvironment,
      enabled: row.enabled,
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
