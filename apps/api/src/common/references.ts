import { makeReference, toDhakaDateString } from "@waafa/shared";
import type { Prisma } from "../generated/prisma/client";

/**
 * The next reference for a prefix, e.g. "FLT-261010-0007": a per-day sequence in Asia/Dhaka, incremented atomically
 * in the database so two requests never get the same number (FR-FLT-05).
 */
export async function nextReference(
  tx: Prisma.TransactionClient,
  prefix: string,
  now: Date,
): Promise<string> {
  const iso = toDhakaDateString(now);
  const day = `${iso.slice(2, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}`;
  const rows = await tx.$queryRaw<Array<{ value: number }>>`
    INSERT INTO "ReferenceSequence" ("prefix", "day", "value") VALUES (${prefix}, ${day}, 1)
    ON CONFLICT ("prefix", "day") DO UPDATE SET "value" = "ReferenceSequence"."value" + 1
    RETURNING "value"`;
  const value = rows[0]?.value;
  if (!value) throw new Error("Reference sequence did not return a value");
  return makeReference(prefix, now, Number(value));
}
