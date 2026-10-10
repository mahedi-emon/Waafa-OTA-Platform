import { useTranslations } from "next-intl";
import { SearchCard } from "@/components/search/SearchCard";

/** Temporary home: hosts the search card (A8) until the real Home (13 sections from data) replaces it in issue #7. */
export default function HomePage() {
  const t = useTranslations("Home");
  return (
    <main id="main" className="site-container flex min-h-dvh flex-col gap-5 pt-10 pb-28 md:pt-16">
      <h1 className="max-w-[16ch] type-display text-navy-900">{t("title")}</h1>
      <p className="max-w-[60ch] type-lead text-mist-600">{t("body")}</p>
      <SearchCard source="home" className="mt-4" />
    </main>
  );
}
