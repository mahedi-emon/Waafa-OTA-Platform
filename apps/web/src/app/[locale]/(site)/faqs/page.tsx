import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Phone } from "lucide-react";
import { FaqCategorySchema, whatsappLink } from "@waafa/shared";
import { PageHero } from "@/components/content/PageHero";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Canonical } from "@/components/seo/Canonical";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { listFaqs } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";
import { FaqBrowser } from "./_components/FaqBrowser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Faqs");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** /faqs (Faqs, Faqs-search, Faqs-m): every admin FAQ with search and topics, FAQPage markup, and a way to ask. */
export default async function FaqsPage() {
  const [faqs, contact, t] = await Promise.all([
    listFaqs(),
    getContactSettings(),
    getTranslations("Faqs"),
  ]);
  const categories = FaqCategorySchema.options.map((key) => ({
    key,
    label: t(`categories.${key}`),
  }));

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <Canonical path="/faqs" />
      {faqs.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }}
        />
      ) : null}
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero kicker={t("kicker")} title={t("title")} lead={t("lead")} />
      </div>
      <FaqBrowser
        faqs={faqs.map((faq) => ({
          id: faq.id,
          category: faq.category,
          question: faq.question,
          answer: faq.answer,
          ...(faq.link ? { link: { label: faq.link.label, href: faq.link.href } } : {}),
        }))}
        categories={categories}
        whatsappE164={contact.whatsappE164}
        labels={{
          search: t("search"),
          searchPlaceholder: t("searchPlaceholder"),
          clearSearch: t("clearSearch"),
          categoriesLabel: t("categoriesLabel"),
          all: t("all"),
          results: t("results", { count: "{count}" }),
          noResultTitle: t("noResultTitle", { query: "{query}" }),
          noResultBody: t("noResultBody"),
          ask: t("ask"),
          askMessage: t("askMessage", { query: "{query}" }),
        }}
      />
      <aside
        aria-labelledby="faqs-help"
        className="flex max-w-3xl flex-col gap-4 rounded-[24px] bg-navy-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 id="faqs-help" className="font-display text-[20px] font-extrabold">
            {t("helpTitle")}
          </h2>
          <p className="text-[14.5px] text-white/80">{t("helpBody")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="white">
            <a href={`tel:${contact.phoneE164}`}>
              <Phone aria-hidden="true" />
              {t("call", { phone: contact.phoneDisplay })}
            </a>
          </Button>
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(
                contact.whatsappE164,
                contact.whatsappMessage.replace("{page}", t("kicker")),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {t("whatsapp")}
            </a>
          </Button>
        </div>
      </aside>
    </main>
  );
}
