import { EventEmitter } from "node:events";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import {
  ADMIN_BASE_PATH,
  hasAnyRole,
  leadModulesForRoles,
  type LeadModule,
  type LiveEvent,
  type Role,
} from "@waafa/shared";
import { ENV, type Env } from "../config/env";

/** Who may receive an event: one person, the people who can open a lead module, or the people with a role. */
export type LiveAudience =
  { staffId: string } | { module: LeadModule } | { roles: readonly Role[] };

export type LiveMessage = { audience: LiveAudience; event: LiveEvent };

const CHANNEL = "waafa:live";

/** Whether a signed-in person may see an event (issue 243): the same rules as the bell and the lead lists. */
export function canSeeEvent(staff: { id: string; roles: readonly Role[] }, audience: LiveAudience) {
  if ("staffId" in audience) return audience.staffId === staff.id;
  if ("module" in audience) return leadModulesForRoles(staff.roles).includes(audience.module);
  return hasAnyRole(staff.roles, ...audience.roles);
}

/** An admin link from the API: the web serves the admin under ADMIN_BASE_PATH. */
export const adminHref = (path: string) => `${ADMIN_BASE_PATH}${path}`;

/**
 * The real-time bus (issue 243). Every API process publishes what arrived (a lead, an order, a payment proof, a
 * personal alert) to one Redis channel and keeps one subscription to it, then fans each message out in memory to the
 * open streams of that process, so 50 open admin tabs cost one Redis connection, not 50. Without Redis (tests, a
 * laptop) messages stay inside the process. Publishing never throws: an alert that cannot be pushed is still in the
 * bell at the next poll.
 */
@Injectable()
export class LiveBus implements OnModuleDestroy {
  private readonly local = new EventEmitter();
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.local.setMaxListeners(0);
  }

  private connect() {
    if (this.publisher || !this.env.REDIS_URL) return;
    const options = { maxRetriesPerRequest: 1, lazyConnect: false } as const;
    this.publisher = new Redis(this.env.REDIS_URL, options);
    this.subscriber = new Redis(this.env.REDIS_URL, options);
    this.publisher.on("error", () => undefined);
    this.subscriber.on("error", () => undefined);
    void this.subscriber.subscribe(CHANNEL).catch(() => undefined);
    this.subscriber.on("message", (_channel: string, raw: string) => {
      try {
        this.local.emit("message", JSON.parse(raw) as LiveMessage);
      } catch {
        // Not ours.
      }
    });
  }

  publish(message: LiveMessage): void {
    this.connect();
    if (this.publisher) {
      void this.publisher.publish(CHANNEL, JSON.stringify(message)).catch(() => {
        this.local.emit("message", message);
      });
      return;
    }
    this.local.emit("message", message);
  }

  /** Calls `listener` for every message until the returned function is called. */
  listen(listener: (message: LiveMessage) => void): () => void {
    this.connect();
    this.local.on("message", listener);
    return () => this.local.off("message", listener);
  }

  /** How many streams this process is feeding (tests and the Status page). */
  listeners(): number {
    return this.local.listenerCount("message");
  }

  async onModuleDestroy(): Promise<void> {
    this.local.removeAllListeners();
    this.subscriber?.disconnect();
    this.publisher?.disconnect();
  }
}
