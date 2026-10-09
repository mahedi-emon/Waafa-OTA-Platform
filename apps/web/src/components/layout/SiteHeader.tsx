import { User } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { getContactSettings, getMenu, getSiteSettings } from "@/lib/data/settings";
import { listCategories } from "@/lib/data/shop";
import { Link } from "@/i18n/navigation";
import { DesktopNav } from "./DesktopNav";
import { HelpMenu } from "./HelpMenu";
import { HelpPanel } from "./HelpPanel";
import { MobileMenu } from "./MobileMenu";
import { MobileMenuBody } from "./MobileMenuBody";
import { MorePanel } from "./MorePanel";
import { ShopMegaPanel } from "./ShopMegaPanel";

/**
 * Sticky site header (Header board, FR-GLB-01): 64 px on phones, 72 px from 1024 px; transparent at the top of the
 * page and solid with blur after 24 px (CSS scroll timeline on a background layer, no JavaScript). Every label,
 * link, panel and contact line comes from the data layer; the WAAFA logo appears here once per page.
 */
async function SiteHeader() {
  const [header, more, drawer, shopPanel, contact, site, categories, t] = await Promise.all([
    getMenu("header"),
    getMenu("more"),
    getMenu("drawer"),
    getMenu("shop-panel"),
    getContactSettings(),
    getSiteSettings(),
    listCategories(),
    getTranslations("Layout"),
  ]);

  const topCategories = categories.filter((category) => category.level === 1);
  const navItems = (header?.items ?? [])
    .filter((item) => item.visible)
    .map(({ id, label, href, panel }) => ({ id, label, href, panel }));

  return (
    <header className="sticky top-0 z-40 h-(--hdr-h)">
      <div
        aria-hidden="true"
        className="absolute inset-0 header-solid-layer border-b border-mist-200/80 bg-white/90 shadow-[0_10px_30px_-24px_rgb(2_13_57/0.45)] backdrop-blur-md"
      />
      <div className="relative site-container flex h-full items-center gap-3">
        <LogoLockup taglineFrom="xl" className="mr-auto lg:mr-0" />

        <DesktopNav
          items={navItems}
          label={t("mainNav")}
          currentLabel={t("current")}
          className="mx-auto hidden lg:flex"
          shopPanel={
            <ShopMegaPanel
              storeName={site.storeName}
              storeIntro={site.storeIntro}
              categories={topCategories}
              services={shopPanel?.items ?? []}
              labels={{
                topCategories: t("topCategories"),
                services: t("services"),
                shopAll: t("shopAll"),
              }}
            />
          }
          morePanel={
            <MorePanel
              items={more?.items ?? []}
              contact={contact}
              labels={{ checkingHours: t("checkingHours"), call: t("call") }}
            />
          }
        />

        <div className="flex items-center gap-1.5 lg:gap-2">
          <HelpMenu
            panel={<HelpPanel contact={contact} />}
            hours={contact.officeHours}
            labels={{
              button: t("helpButton"),
              title: t("needHelp"),
              description: contact.helpLine,
            }}
          />
          {site.accountsLive ? (
            <Link
              href="/login"
              className="hidden h-11 items-center gap-2 rounded-full bg-navy-900 px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-royal-800 focus-visible:ring-3 focus-visible:ring-ring/40 lg:inline-flex"
            >
              <User aria-hidden="true" className="size-[18px]" />
              {t("logIn")}
            </Link>
          ) : null}
          <MobileMenu
            className="lg:hidden"
            logo={<LogoLockup tagline={false} />}
            body={
              <MobileMenuBody
                links={drawer?.items ?? []}
                more={more?.items ?? []}
                contact={contact}
              />
            }
            labels={{
              open: t("openMenu"),
              close: t("closeMenu"),
              title: t("menuTitle"),
              description: contact.helpLine,
            }}
          />
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
