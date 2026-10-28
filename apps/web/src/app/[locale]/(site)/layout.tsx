import { NextIntlClientProvider } from "next-intl";
import { TabBarMark } from "@/components/brand/TabBarMark";
import { getMessages, getTranslations } from "next-intl/server";
import { MaintenanceScreen } from "@/components/feedback/MaintenanceScreen";
import { CardFxDriver } from "@/components/fx/CardFxDriver";
import { OfflineNotice } from "@/components/feedback/OfflineNotice";
import { Analytics } from "@/components/analytics/Analytics";
import { SupportContactProvider } from "@/components/feedback/SupportContact";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { LazyToaster } from "@/components/feedback/LazyToaster";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { MoreSheetBody } from "@/components/layout/MoreSheetBody";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TabBar } from "@/components/layout/TabBar";
import { StaffToolsLoader } from "@/components/staff/StaffToolsLoader";
import { TurnstileKeyProvider } from "@/components/forms/TurnstileKeyProvider";
import { pickMessages } from "@/i18n/pickMessages";
import { getIntegrations } from "@/lib/data/integrations";
import { getContactSettings, getMenu, getPublicConfig } from "@/lib/data/settings";

/**
 * Public site frame (A6): announcement, sticky header, page, footer, phone tab bar and the floating WhatsApp button.
 * Pages render their own <main id="main"> (the skip link's target). The bottom padding keeps the footer clear of the
 * tab bar on phones. For staff only: the preview banner (draft mode) and the staff tools (D0 R7).
 */
export default async function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  const [contact, config, integrations, tabbar, more, morePhone, messages, t, tErrors] =
    await Promise.all([
      getContactSettings(),
      getPublicConfig(),
      getIntegrations(),
      getMenu("tabbar"),
      getMenu("more"),
      getMenu("more-phone"),
      getMessages(),
      getTranslations("Layout"),
      getTranslations("Errors.offline"),
    ]);
  if (config.maintenance.enabled) {
    return <MaintenanceScreen maintenance={config.maintenance} contact={contact} />;
  }

  const tabs = (tabbar?.items ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    panel: item.panel,
    icon: <MenuIcon name={item.icon} />,
  }));

  return (
    <div className="flex min-h-dvh flex-col pb-(--tab-space) lg:pb-0">
      <PreviewBanner />
      <AnnouncementBar />
      <SiteHeader />
      <SupportContactProvider
        value={{
          phoneDisplay: contact.phoneDisplay,
          phoneE164: contact.phoneE164,
          whatsappE164: contact.whatsappE164,
        }}
      >
        {/* The error boundary sits between this layout and the page, so its strings come from here. */}
        <NextIntlClientProvider messages={pickMessages(messages, ["Errors"])}>
          <TurnstileKeyProvider siteKey={integrations.public.turnstileSiteKey}>
            <div className="flex flex-1 flex-col">{children}</div>
          </TurnstileKeyProvider>
        </NextIntlClientProvider>
      </SupportContactProvider>
      <SiteFooter />
      <CardFxDriver />
      {tabs.length === 5 ? (
        <TabBar
          items={tabs}
          mark={<TabBarMark />}
          moreSheet={
            <MoreSheetBody
              items={[...(more?.items ?? []), ...(morePhone?.items ?? [])]}
              contact={contact}
            />
          }
          labels={{
            nav: t("tabBar"),
            moreTitle: t("moreTitle"),
            moreDescription: contact.helpLine,
            close: t("close"),
            current: t("current"),
          }}
        />
      ) : null}
      <FloatingWhatsApp
        e164={contact.whatsappE164}
        messageTemplate={contact.whatsappMessage}
        label={t("whatsappChat")}
      />
      <OfflineNotice
        phoneE164={contact.phoneE164}
        labels={{
          title: tErrors("title"),
          body: tErrors("body"),
          retry: tErrors("retry"),
          call: tErrors("call"),
        }}
      />
      <LazyToaster />
      <StaffToolsLoader />
      <Analytics />
    </div>
  );
}
