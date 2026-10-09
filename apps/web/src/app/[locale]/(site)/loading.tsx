import { useTranslations } from "next-intl";
import { BrandLoader } from "@/components/brand/BrandLoader";

/**
 * Route loading state (FR-GLB-05): the W ribbon draws itself, but only fades in after 300 ms, so fast navigations
 * never flash a loader. Static under reduced motion.
 */
export default function SiteLoading() {
  const t = useTranslations("Loader");
  return (
    <main id="main" className="grid min-h-[60dvh] place-items-center">
      <BrandLoader label={t("page")} />
    </main>
  );
}
