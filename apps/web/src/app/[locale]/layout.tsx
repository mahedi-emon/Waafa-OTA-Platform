import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { THEME_COLOR } from "@/components/brand/brandColors";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routing } from "@/i18n/routing";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
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
        {/* Messages stay on the server; client leaves get strings as props or a scoped provider. */}
        <NextIntlClientProvider messages={null}>
          <MotionProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
