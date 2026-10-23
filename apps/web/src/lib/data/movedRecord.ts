import "server-only";
import type { RoutedKey } from "@waafa/shared";
import { getLocale } from "next-intl/server";
import { permanentRedirect } from "@/i18n/navigation";
import { getMovedSlug } from "./content";

/**
 * A record whose link changed in Admin (D0 R4, D218): its old address redirects for good to the new one, so shared
 * links and search results keep working. Call it right before a record page's 404; it returns only when the address
 * never belonged to a record.
 */
export async function followMovedRecord(
  collection: RoutedKey,
  slug: string,
  pathOf: (slug: string) => string,
): Promise<void> {
  const moved = await getMovedSlug(collection, slug);
  if (moved) permanentRedirect({ href: pathOf(moved), locale: await getLocale() });
}
