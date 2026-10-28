import { getTranslations } from "next-intl/server";
import { getIntegrations } from "@/lib/data/integrations";
import { ConsentBar } from "./ConsentBar";

/**
 * Analytics from Admin › Integrations (issues 102 and 284): renders the consent bar only when at least one of GA4,
 * GTM and Meta Pixel is On, so a site without analytics shows no bar and loads no third-party script.
 */
async function Analytics() {
  const [integrations, t] = await Promise.all([getIntegrations(), getTranslations("Consent")]);
  const { gtmId, ga4Id, metaPixelId } = integrations.public;
  const ids = {
    ...(gtmId ? { gtmId } : {}),
    ...(ga4Id ? { ga4Id } : {}),
    ...(metaPixelId ? { metaPixelId } : {}),
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
