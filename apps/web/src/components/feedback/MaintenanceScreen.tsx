import { getTranslations } from "next-intl/server";
import { Phone } from "lucide-react";
import {
  formatDate,
  formatTime,
  whatsappLink,
  type ContactSettings,
  type MaintenanceSettings,
} from "@waafa/shared";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { SystemState } from "./SystemState";

type MaintenanceScreenProps = { maintenance: MaintenanceSettings; contact: ContactSettings };

/**
 * Maintenance mode (Maintenance board; Admin › Settings › Maintenance): replaces the public site while the team still
 * answers calls and WhatsApp. The admin and the API are not affected. Not indexed.
 */
async function MaintenanceScreen({ maintenance, contact }: MaintenanceScreenProps) {
  const t = await getTranslations("Errors.maintenance");
  return (
    <div className="flex min-h-dvh flex-col bg-mist-25">
      <title>{t("metaTitle")}</title>
      <meta name="robots" content="noindex" />
      <header className="site-container flex h-16 items-center md:h-[72px]">
        <LogoLockup tagline={false} asLink={false} />
      </header>
      <main id="main" className="site-container flex flex-1 flex-col">
        <SystemState
          code={t("code")}
          title={t("title")}
          lead={maintenance.message}
          actions={
            <>
              <Button asChild size="lg" variant="whatsapp">
                <a
                  href={whatsappLink(contact.whatsappE164)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {t("whatsapp")}
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={`tel:${contact.phoneE164}`}>
                  <Phone aria-hidden="true" />
                  {t("call", { phone: contact.phoneDisplay })}
                </a>
              </Button>
            </>
          }
        >
          {maintenance.backAt ? (
            <p className="text-[15px] font-semibold text-navy-900">
              {t("backBy", {
                time: formatTime(maintenance.backAt),
                date: formatDate(maintenance.backAt),
              })}
            </p>
          ) : null}
        </SystemState>
      </main>
    </div>
  );
}

export { MaintenanceScreen };
