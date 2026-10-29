import type { PrismaClient } from "../generated/prisma/client";
import type { ProviderContext } from "./adapters";
import { SecretBox } from "./secretBox";

type Prisma = Pick<PrismaClient, "integrationSetting" | "providerCredential">;

export type ActiveIntegration = { provider: string; context: ProviderContext };

const CACHE_MS = 60_000;

/**
 * The provider of one kind that is on in Admin › Integrations, with its opened values (issue 252), for code that runs
 * outside the Nest container too (the worker). The same rules as ProvidersService: the card is on, the values of the
 * mode in use are saved, the last test did not fail and the secrets open. Cached for a minute; null means "off".
 */
export class ActiveIntegrations {
  private readonly box: SecretBox | null;
  private readonly cache = new Map<string, { at: number; value: ActiveIntegration | null }>();

  constructor(
    private readonly prisma: Prisma,
    secretKey: string | undefined,
  ) {
    this.box = secretKey ? new SecretBox(secretKey) : null;
  }

  async get(
    kind: string,
    providers: readonly string[],
    now = Date.now(),
  ): Promise<ActiveIntegration | null> {
    const key = `${kind}:${providers.join(",")}`;
    const hit = this.cache.get(key);
    if (hit && now - hit.at < CACHE_MS) return hit.value;
    let value: ActiveIntegration | null = null;
    try {
      value = await this.load(kind, providers);
    } catch {
      value = null;
    }
    this.cache.set(key, { at: now, value });
    return value;
  }

  /** Forget cached values (tests, and right after staff save or test a card in this process). */
  clear(): void {
    this.cache.clear();
  }

  private async load(
    kind: string,
    providers: readonly string[],
  ): Promise<ActiveIntegration | null> {
    const settings = await this.prisma.integrationSetting.findMany({
      where: { kind, isActive: true, provider: { in: [...providers] } },
      orderBy: { updatedAt: "desc" },
    });
    for (const setting of settings) {
      const row = await this.prisma.providerCredential.findUnique({
        where: {
          provider_environment: {
            provider: setting.provider,
            environment: setting.isLive ? "production" : "sandbox",
          },
        },
      });
      if (!row || row.healthOk === false) continue;
      const sealed = row.secrets as Record<string, string>;
      if (Object.keys(sealed).length > 0 && !this.box) continue;
      try {
        const secrets = Object.fromEntries(
          Object.entries(sealed).map(([name, value]) => [
            name,
            this.box ? this.box.open(value) : "",
          ]),
        );
        return {
          provider: setting.provider,
          context: {
            environment: row.environment as ProviderContext["environment"],
            settings: row.settings as Record<string, string>,
            secrets,
          },
        };
      } catch {
        continue;
      }
    }
    return null;
  }
}
