import { dottedOf } from "@/lib/admin/blueprints/paths";
import type { Path } from "@/lib/admin/schema";

/** A stable element id for a field ("field-prices-2-price"). */
export function fieldId(path: Path): string {
  return `field-${dottedOf(path).replace(/[^\w-]/g, "-") || "root"}`;
}

/** The ids an input points at with aria-describedby: its help and its error. */
export function describedBy(
  id: string,
  help: string | undefined,
  error: string | undefined,
): string | undefined {
  return (
    [help ? `${id}-help` : undefined, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined
  );
}
