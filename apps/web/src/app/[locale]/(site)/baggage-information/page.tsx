import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Plane } from "lucide-react";
import { formatDate, whatsappLink } from "@waafa/shared";
import { InfoCard } from "@/components/content/InfoCard";
import { PageHero } from "@/components/content/PageHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Canonical } from "@/components/seo/Canonical";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { listBaggageRules, listPageBlocks } from "@/lib/data/content";
import { getContactSettings } from "@/lib/data/settings";
import { BaggageTable } from "./_components/BaggageTable";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Baggage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * /baggage-information (Baggage, Baggage-m): the usual sizes, typical allowances by airline (Admin › Baggage table),
 * cabin-or-checked rules (page blocks) and help. The page always says the e-ticket is the final word.
 */
export default async function BaggagePage() {
  const [rules, blocks, contact, t] = await Promise.all([
    listBaggageRules(),
    listPageBlocks("baggage"),
    getContactSettings(),
    getTranslations("Baggage"),
  ]);
  const facts = blocks.filter((block) => block.group === "facts");
  const guidance = blocks.filter((block) => block.group === "rules");
  const sample = rules.some((rule) => rule.sample) || blocks.some((block) => block.sample);

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:gap-14 md:pt-6">
      <Canonical path="/baggage-information" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <PageHero
          kicker={t("kicker")}
          title={t("title")}
          lead={t("lead")}
          aside={sample ? <SampleBadge label={t("sample")} /> : null}
        />
      </div>

      {facts.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 rounded-[24px] border border-mist-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {facts.map((block) => (
            <li key={block.id}>
              <InfoCard block={block} variant="row" />
            </li>
          ))}
        </ul>
      ) : null}

      {rules.length > 0 ? (
        <section aria-labelledby="baggage-table" className="flex flex-col gap-5">
          <h2 id="baggage-table" className="type-h2 text-navy-900">
            {t("tableTitle")}
          </h2>
          <BaggageTable
            rules={rules.map(({ sample: _sample, ...rule }) => ({
              ...rule,
              checkedLabel: t("checked", { date: formatDate(rule.lastVerified) }),
            }))}
            labels={{
              search: t("search"),
              scopeLabel: t("scopeLabel"),
              scopes: {
                international: t("scopes.international"),
                domestic: t("scopes.domestic"),
              },
              classLabel: t("classLabel"),
              classes: {
                economy: t("classes.economy"),
                "premium-economy": t("classes.premium-economy"),
                business: t("classes.business"),
                first: t("classes.first"),
              },
              columns: {
                airline: t("columns.airline"),
                cabin: t("columns.cabin"),
                checked: t("columns.checked"),
                note: t("columns.note"),
              },
              noMatch: t("noMatch", { query: "{query}" }),
              noRows: t("noRows"),
            }}
          />
          <p className="max-w-4xl text-[13.5px] leading-relaxed text-mist-600">{t("disclaimer")}</p>
        </section>
      ) : null}

      {guidance.length > 0 ? (
        <section aria-labelledby="baggage-rules" className="flex flex-col gap-5">
          <h2 id="baggage-rules" className="type-h2 text-navy-900">
            {t("rulesTitle")}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guidance.map((block) => (
              <li key={block.id}>
                <InfoCard block={block} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <aside
        aria-labelledby="baggage-more"
        className="flex flex-col gap-4 rounded-[24px] bg-navy-900 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8"
      >
        <div>
          <h2 id="baggage-more" className="font-display text-[22px] font-extrabold">
            {t("moreTitle")}
          </h2>
          <p className="max-w-[56ch] text-[15px] text-white/80">{t("moreBody")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="white">
            <Link href="/flights">
              <Plane aria-hidden="true" />
              {t("searchFlights")}
            </Link>
          </Button>
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(contact.whatsappE164, t("askMessage"))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {t("ask")}
            </a>
          </Button>
        </div>
      </aside>
    </main>
  );
}
