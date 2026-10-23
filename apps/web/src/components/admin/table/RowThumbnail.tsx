import { AdminThumb } from "@/components/admin/AdminThumb";
import type { RowThumb } from "./types";

/** The row's 40 px photo, or the initials when it has none. */
function RowThumbnail({ thumb, name }: { thumb?: RowThumb | undefined; name: string }) {
  if (!thumb) return null;
  if ("initials" in thumb) return <AdminThumb name={thumb.initials} />;
  return <AdminThumb src={thumb.src} name={name} />;
}

export { RowThumbnail };
