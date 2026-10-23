import { hasPublishWorkflow, isContentKey } from "@waafa/shared";
import type { RecordChip, RecordChipName } from "@waafa/shared/workflow/chips";
import type { getTranslations } from "next-intl/server";
import { formatDhakaDateTime } from "./format";

/** The `Admin.chips` translator. */
export type ChipTranslator = Awaited<ReturnType<typeof getTranslations<"Admin.chips">>>;

/** Why a row has its chip, with the date or number it names (D0 R4). */
export function chipReason(t: ChipTranslator, chip: RecordChip): string {
  const date = (iso: string) => formatDhakaDateTime(iso);
  switch (chip.name) {
    case "scheduled":
    case "expired":
    case "ended":
      return chip.at ? t(`reasons.${chip.name}`, { date: date(chip.at) }) : "";
    case "live":
      return chip.at
        ? t("reasons.liveSince", { date: date(chip.at) })
        : chip.until
          ? t("reasons.liveUntil", { date: date(chip.until) })
          : t("reasons.live");
    case "active":
      return chip.until
        ? t("reasons.activeUntil", { date: date(chip.until) })
        : t("reasons.active");
    case "open":
      return chip.until ? t("reasons.openUntil", { date: date(chip.until) }) : t("reasons.open");
    case "usedUp":
    case "fewSeats":
      return t(`reasons.${chip.name}`, { count: chip.count ?? 0 });
    default:
      return t(`reasons.${chip.name}`);
  }
}

const WINDOW: RecordChipName[] = ["scheduled", "live", "ended", "off"];
const WORKFLOW: RecordChipName[] = ["draft", "scheduled", "live", "archived"];

/** The chips a list's status filter offers, in the order staff think of them (D0 R5). */
export function chipFilterNames(
  key: string,
  sample: Record<string, unknown> | undefined,
): RecordChipName[] {
  switch (key) {
    case "banners":
    case "announcements":
      return WINDOW;
    case "deals":
      return ["live", "ended"];
    case "coupons":
      return ["scheduled", "active", "usedUp", "expired", "off"];
    case "groupFares":
      return ["open", "fewSeats", "soldOut", "expired"];
    case "products":
      return [...WORKFLOW, "inStock", "lowStock", "outOfStock"];
    default:
      if (isContentKey(key) && hasPublishWorkflow(key)) return WORKFLOW;
      if (sample && (typeof sample.visible === "boolean" || typeof sample.enabled === "boolean"))
        return ["shown", "hidden"];
      return [];
  }
}
