import { createHmac } from "node:crypto";
import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { ENV, type Env } from "../config/env";

/** HMAC-SHA256 of the request body with REVALIDATE_SECRET, hex: the web checks it before revalidating. */
export function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Tells the web which content keys changed (PRD §15 caching): a signed POST to the web's revalidation route, which
 * maps keys to its cache tags. Calls are batched for two seconds so a burst of edits or orders sends one request.
 */
@Injectable()
export class RevalidateService implements OnModuleDestroy {
  private readonly logger = new Logger("Revalidate");
  private readonly pending = new Set<string>();
  private timer: NodeJS.Timeout | null = null;

  constructor(@Inject(ENV) private readonly env: Env) {}

  onModuleDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  request(keys: string[]): void {
    if (!this.env.WEB_REVALIDATE_URL || this.env.NODE_ENV === "test") return;
    for (const key of keys) this.pending.add(key);
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, 2_000);
  }

  private async flush(): Promise<void> {
    const url = this.env.WEB_REVALIDATE_URL;
    if (!url || this.pending.size === 0) return;
    const body = JSON.stringify({ keys: [...this.pending], at: new Date().toISOString() });
    this.pending.clear();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-waafa-signature": signBody(body, this.env.REVALIDATE_SECRET),
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) this.logger.warn(`Web revalidation answered ${response.status}`);
    } catch (error) {
      this.logger.warn(`Web revalidation failed: ${String(error)}`);
    }
  }
}
