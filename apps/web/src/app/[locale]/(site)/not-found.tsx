import { getTranslations } from "next-intl/server";
import { ArrowRight, House } from "lucide-react";
import { SystemState } from "@/components/feedback/SystemState";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const LINKS = [
  { key: "packages", href: "/tour-packages" },
  { key: "visa", href: "/visa-services" },
  { key: "store", href: "/shop" },
  { key: "track", href: "/shop/track" },
  { key: "contact", href: "/contact" },
] as const;

/**
 * Branded 404 (Error board, "This page took a different flight"): inside the site frame, with a way home and the
 * most-used pages. Unknown URLs reach it through the [...rest] catch-all; unknown records through notFound().
 */
export default async function NotFound() {
  const t = await getTranslations("Errors.notFound");
  return (
    <main id="main" className="site-container flex flex-1 flex-col pt-4 pb-28">
      <title>{t("metaTitle")}</title>
      <SystemState
        code={t("code")}
        title={t("title")}
        lead={t("lead")}
        actions={
          <Button asChild size="lg">
            <Link href="/">
              <House aria-hidden="true" />
              {t("home")}
            </Link>
          </Button>
        }
      >
        <nav aria-label={t("links")} className="w-full pt-4">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-mist-200 bg-white px-4 text-[15px] font-semibold text-navy-900 outline-none hover:border-mist-300 focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {t(item.key)}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-brand-700 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SystemState>
    </main>
  );
}
