import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { NavDriver } from "@/components/nav/NavDriver";
import { THEME_COLOR } from "@/components/brand/brandColors";
import { routing } from "@/i18n/routing";
import { getIntegrations } from "@/lib/data/integrations";
import { getSiteSettings } from "@/lib/data/settings";
import { defaultShareImage } from "@/lib/seo/withSocial";
import { SITE_URL } from "@/lib/siteUrl";
import "../globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Inter and Plus Jakarta Sans have no taka sign: this 2.6 KB Hind Siliguri subset draws only "৳".
const taka = localFont({
  src: "../../assets/fonts/waafa-taka.woff2",
  variable: "--font-taka",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+09F3" }],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Site-wide defaults (#96): title template, the admin default SEO title and description, a share preview for pages
 * without their own, large image previews for Google, and the Search Console and Bing verification codes from
 * Settings › General.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [t, site, image, integrations] = await Promise.all([
    getTranslations("Metadata"),
    getSiteSettings(),
    defaultShareImage(),
    getIntegrations(),
  ]);
  // Search Console and Bing codes live on their Admin › Integrations cards (issue 284).
  const google = integrations.public.googleVerification;
  const bing = integrations.public.bingVerification;
  const title = site.defaultSeo.title ?? t("title");
  const description = site.defaultSeo.description ?? t("description");
  const verification: Metadata["verification"] = {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: t("titleTemplate") },
    description,
    applicationName: site.travelBrand,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      siteName: site.travelBrand,
      locale: "en_BD",
      type: "website",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}

// Pinch-zoom stays on: no maximumScale and no userScalable=false (WCAG 1.4.4).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLOR,
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const t = await getTranslations("Common");

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable} ${taka.variable}`}>
      <body className="min-h-dvh">
        {/*
         * Form validation (zod) without its eval probe: the CSP has no 'unsafe-eval', and the caught probe still
         * shows up as a CSP issue in Lighthouse Best Practices (issue 91).
         */}
        <Script id="zod-jitless" strategy="beforeInteractive">
          {
            "globalThis.__zod_globalConfig=Object.assign(globalThis.__zod_globalConfig||{},{jitless:true});"
          }
        </Script>
        <a
          href="#main"
          className="sr-only rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          {t("skipToContent")}
        </a>
        {/* Scroll-reveal targets stay visible when JavaScript is off (MOTION.md §5). */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        {/*
         * Messages stay on the server; client leaves get strings as props or a scoped provider. Motion's LazyMotion
         * and the tooltip provider wrap only the screens that use them (issue 91: no animation library in the
         * public first load).
         */}
        <NextIntlClientProvider messages={null}>{children}</NextIntlClientProvider>
        {/* Client-side navigation for the plain links Server Components render (issue 236). */}
        <NavDriver />
      </body>
    </html>
  );
}
