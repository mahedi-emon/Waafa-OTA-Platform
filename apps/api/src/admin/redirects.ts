import { isRoutedKey } from "@waafa/shared";
import type { Prisma } from "../generated/prisma/client";

/**
 * Keeps old record addresses working (D0 R4): a record whose link moves from `from` to `to` leaves a permanent
 * redirect; redirects that pointed at `from` now point at `to`, so a visitor never follows a chain; and a redirect
 * from the new address goes, because a real record lives there now.
 */
export async function recordMove(
  tx: Prisma.TransactionClient,
  collection: string,
  from: string,
  to: string,
): Promise<void> {
  if (!isRoutedKey(collection) || from === to) return;
  await tx.slugRedirect.deleteMany({ where: { collection, fromId: to } });
  await tx.slugRedirect.updateMany({ where: { collection, toId: from }, data: { toId: to } });
  await tx.slugRedirect.upsert({
    where: { collection_fromId: { collection, fromId: from } },
    create: { collection, fromId: from, toId: to },
    update: { toId: to },
  });
}

/** A record now lives at `id` (created there or back from Trash): a redirect from that address would hide it. */
export async function clearRedirectFrom(
  tx: Prisma.TransactionClient,
  collection: string,
  id: string,
): Promise<void> {
  if (!isRoutedKey(collection)) return;
  await tx.slugRedirect.deleteMany({ where: { collection, fromId: id } });
}
