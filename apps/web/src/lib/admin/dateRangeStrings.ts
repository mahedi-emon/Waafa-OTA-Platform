import "server-only";
import { getTranslations } from "next-intl/server";
import type { AdminDateRangeStrings } from "@/components/admin/AdminDateRange";

/** The date range picker's words, read on the server and passed to the client picker (D190). */
export async function dateRangeStrings(): Promise<AdminDateRangeStrings> {
  const [t, tr] = await Promise.all([
    getTranslations("Admin.dateRange"),
    getTranslations("Admin.reports"),
  ]);
  return {
    label: t("label"),
    any: t("any"),
    apply: t("apply"),
    clear: t("clear"),
    range: t("range", { from: "{from}", to: "{to}" }),
    previous: t("previous"),
    next: t("next"),
    presets: {
      last7: tr("presets.last7"),
      last30: tr("presets.last30"),
      thisMonth: tr("presets.thisMonth"),
      lastMonth: tr("presets.lastMonth"),
    },
  };
}
