import { useTranslations } from "next-intl";

/** Temporary foundation page; the real Home (13 sections from data) replaces it in issue #7. */
export default function HomePage() {
  const t = useTranslations("Home");

  return (
    <main id="main" className="site-container flex min-h-dvh flex-col justify-center gap-5 py-16">
      <h1 className="max-w-[16ch] type-display text-navy-900">{t("title")}</h1>
      <p className="max-w-[60ch] type-lead text-mist-600">{t("body")}</p>
      <div aria-hidden="true" className="h-1.5 w-40 rounded-full bg-(image:--ribbon)" />
    </main>
  );
}
