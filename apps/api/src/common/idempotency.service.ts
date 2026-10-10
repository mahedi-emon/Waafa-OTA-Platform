import { setTimeout as sleep } from "node:timers/promises";
import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "../generated/prisma/client";
import { problems } from "./problem";

const TTL_MS = 24 * 60 * 60_000;
const PENDING = 0;

export type Outcome<T> = { status: number; body: T };
export type Replayable<T> = Outcome<T> & { replayed: boolean };

/**
 * Idempotency-Key handling (PRD §15 API conventions): the first request with a key claims it and stores its outcome;
 * a repeat (a double tap, a retry after a timeout) gets the same outcome instead of a second lead or order. A repeat
 * that arrives while the first is still running waits for it. Only successful outcomes are kept: after a refusal
 * (the cart changed, cash on delivery not allowed) the visitor fixes the form and may send the same key again.
 */
@Injectable()
export class IdempotencyService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async once<T>(
    key: string,
    scope: string,
    run: () => Promise<Outcome<T>>,
  ): Promise<Replayable<T>> {
    const id = `${scope}:${key}`;
    const now = new Date();
    await this.prisma.idempotencyRecord.deleteMany({ where: { key: id, expiresAt: { lt: now } } });
    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          key: id,
          scope,
          status: PENDING,
          response: {},
          expiresAt: new Date(now.getTime() + TTL_MS),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { ...(await this.waitForStored<T>(id)), replayed: true };
      }
      throw error;
    }
    let outcome: Outcome<T>;
    try {
      outcome = await run();
    } catch (error) {
      // A failed attempt may be retried with the same key.
      await this.release(id);
      throw error;
    }
    if (outcome.status >= 400) {
      await this.release(id);
    } else {
      await this.prisma.idempotencyRecord.update({
        where: { key: id },
        data: { status: outcome.status, response: outcome.body as Prisma.InputJsonValue },
      });
    }
    return { ...outcome, replayed: false };
  }

  private async release(id: string): Promise<void> {
    await this.prisma.idempotencyRecord.delete({ where: { key: id } }).catch(() => undefined);
  }

  private async waitForStored<T>(id: string): Promise<Outcome<T>> {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const record = await this.prisma.idempotencyRecord.findUnique({ where: { key: id } });
      if (!record)
        throw problems.conflict("The first request did not finish; send it again", "retry");
      if (record.status !== PENDING) return { status: record.status, body: record.response as T };
      await sleep(100);
    }
    throw problems.conflict("The same request is still being processed", "in-progress");
  }

  /** Housekeeping for the worker: drop expired keys. */
  async purgeExpired(now = new Date()): Promise<number> {
    const result = await this.prisma.idempotencyRecord.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return result.count;
  }
}
