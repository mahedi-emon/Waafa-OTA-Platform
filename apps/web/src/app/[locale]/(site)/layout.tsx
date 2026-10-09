import { getTranslations } from "next-intl/server";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { MoreSheetBody } from "@/components/layout/MoreSheetBody";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TabBar } from "@/components/layout/TabBar";
import { Toaster } from "@/components/ui/sonner";
import { getContactSettings, getMenu } from "@/lib/data/settings";

/**
 * Public site frame (A6): announcement, sticky header, page, footer, phone tab bar and the floating WhatsApp button.
 * Pages render their own <main id="main"> (the skip link's target). The bottom padding keeps the footer clear of the
 * tab bar on phones.
 */
export default async function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  const [contact, tabbar, more, morePhone, t] = await Promise.all([
    getContactSettings(),
    getMenu("tabbar"),
    getMenu("more"),
    getMenu("more-phone"),
    getTranslations("Layout"),
  ]);

  const tabs = (tabbar?.items ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    panel: item.panel,
    icon: <MenuIcon name={item.icon} />,
  }));

  return (
    <div className="flex min-h-dvh flex-col pb-(--tab-space) lg:pb-0">
      <AnnouncementBar />
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
      {tabs.length === 5 ? (
        <TabBar
          items={tabs}
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
      <Toaster />
    </div>
  );
}
