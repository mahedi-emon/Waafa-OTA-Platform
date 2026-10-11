import { getTranslations } from "next-intl/server";
import { getTrackingSettings } from "@/lib/data/settings";
import { ConsentBar } from "./ConsentBar";

/**
 * Analytics from Settings › Tracking (issue 102): renders the consent bar only when at least one ID is set, so a site
 * without analytics shows no bar and loads no third-party script.
 */
async function Analytics() {
  const [tracking, t] = await Promise.all([getTrackingSettings(), getTranslations("Consent")]);
  const ids = {
    ...(tracking.gtmId ? { gtmId: tracking.gtmId } : {}),
    ...(tracking.ga4Id ? { ga4Id: tracking.ga4Id } : {}),
    ...(tracking.metaPixelId ? { metaPixelId: tracking.metaPixelId } : {}),
  };
  if (Object.keys(ids).length === 0) return null;
  return (
    <ConsentBar
      ids={ids}
      strings={{
        region: t("region"),
        text: t("text"),
        accept: t("accept"),
        decline: t("decline"),
        privacy: t("privacy"),
      }}
    />
  );
}

export { Analytics };
