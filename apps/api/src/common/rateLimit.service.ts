import { createHash } from "node:crypto";
import { Inject, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import { ENV, type Env } from "../config/env";

export type RateRule = { limit: number; windowMs: number };

/**
 * The API's rate limits (PRD NFR-SEC, issue 234). Each rule is a fixed window: a key may make `limit` requests per
 * `windowMs`.
 */
export const RATE_RULES = {
  /** Staff sign-in per address: 5 per 15 minutes (the account lockout is separate). */
  login: { limit: 5, windowMs: 15 * 60_000 },
  /** The second sign-in step (authenticator or recovery code) per address. */
  loginCode: { limit: 10, windowMs: 15 * 60_000 },
  invite: { limit: 5, windowMs: 15 * 60_000 },
  customerSignIn: { limit: 10, windowMs: 60_000 },
  customerAccount: { limit: 60, windowMs: 60_000 },
  /** Email sign-in codes (issue 241): 5 an hour per address of email, 20 an hour per visitor address. */
  customerCodeEmail: { limit: 5, windowMs: 60 * 60_000 },
  customerCodeIp: { limit: 20, windowMs: 60 * 60_000 },
  /** Code checks per visitor address; each code also allows only 5 tries. */
  customerCodeVerify: { limit: 30, windowMs: 15 * 60_000 },
  /** Password sign-in tries per email (issue 278): 5 in 15 minutes, like a code. */
  customerPassword: { limit: 5, windowMs: 15 * 60_000 },
  uploads: { limit: 40, windowMs: 60_000 },
  // Per-visitor limits behind the web's own: the web limits first, these catch anything that reaches the API another
  // way. Twice the web's numbers, so the two layers never disagree for a real visitor.
  leads: { limit: 10, windowMs: 60_000 },
  /** NFR-SEC: 10 requests per hour from one phone number, whatever the address. */
  leadsPerPhone: { limit: 10, windowMs: 60 * 60_000 },
  orders: { limit: 12, windowMs: 60_000 },
  track: { limit: 30, windowMs: 60_000 },
  /** /track lookups per visitor address (issue 240): 20 in 10 minutes, twice the web's own limit. */
  trackLookup: { limit: 20, windowMs: 10 * 60_000 },
  feedback: { limit: 10, windowMs: 60_000 },
  proofs: { limit: 10, windowMs: 60_000 },
  searchLogs: { limit: 60, windowMs: 60_000 },
  subscribers: { limit: 10, windowMs: 60_000 },
  /** A customer's quote page and its PDF (issue 298), per visitor address. */
  quotes: { limit: 60, windowMs: 60_000 },
  /** Accepting a quote (issue 298): twice the web's 5 a minute. */
  quoteAccept: { limit: 10, windowMs: 60_000 },
  /** Reviews and product questions (issue 245): twice the web's 5 a minute. */
  reviews: { limit: 10, windowMs: 60_000 },
  questions: { limit: 10, windowMs: 60_000 },
} satisfies Record<string, RateRule>;

export type RateBucket = keyof typeof RATE_RULES;

/**
 * Fixed-window counters shared by every API process through Redis, so limits hold across replicas and survive a
 * restart (issue 234). Without `REDIS_URL` (development and tests) or while Redis is unreachable, the counters live in
 * this process instead: a limit is never silently switched off. Keys are hashed, so no address or phone number is
 * stored in Redis.
 */
@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis: Redis | null;
  private readonly memory = new Map<string, { count: number; resetAt: number }>();
  private readonly factor: number;
  private lastWarning = 0;

  constructor(@Inject(ENV) env: Env) {
    this.factor = env.RATE_LIMIT_FACTOR;
    this.redis = env.REDIS_URL
      ? new Redis(env.REDIS_URL, {
          // Fail fast: a request never waits for Redis; the in-process counter takes over.
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 2_000,
        })
      : null;
    this.redis?.on("error", (error: Error) => this.warn(error));
  }

  /** True while `key` is within the bucket's limit; each call counts one request. */
  async allow(bucket: RateBucket, key: string, now: number = Date.now()): Promise<boolean> {
    const base: RateRule = RATE_RULES[bucket];
    const rule = { limit: base.limit * this.factor, windowMs: base.windowMs };
    const window = Math.floor(now / rule.windowMs);
    const id = `rl:${bucket}:${createHash("sha256").update(key).digest("base64url").slice(0, 22)}:${window}`;
    if (this.redis && this.redis.status === "ready") {
      try {
        const results = await this.redis.multi().incr(id).pexpire(id, rule.windowMs).exec();
        const count = Number(results?.[0]?.[1]);
        if (Number.isFinite(count) && count > 0) return count <= rule.limit;
      } catch (error) {
        this.warn(error);
      }
    }
    return this.allowInMemory(id, rule, window, now);
  }

  private allowInMemory(id: string, rule: RateRule, window: number, now: number): boolean {
    const entry = this.memory.get(id);
    if (entry && entry.resetAt > now) {
      entry.count += 1;
      return entry.count <= rule.limit;
    }
    if (this.memory.size > 10_000) {
      for (const [key, value] of this.memory) if (value.resetAt <= now) this.memory.delete(key);
    }
    this.memory.set(id, { count: 1, resetAt: (window + 1) * rule.windowMs });
    return true;
  }

  private warn(error: unknown): void {
    const now = Date.now();
    if (now - this.lastWarning < 60_000) return;
    this.lastWarning = now;
    this.logger.warn(
      `Rate limits fell back to this process: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.redis) return;
    await this.redis.quit().catch(() => this.redis?.disconnect());
  }
}
