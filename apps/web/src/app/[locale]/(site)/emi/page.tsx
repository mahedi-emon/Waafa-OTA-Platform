import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatTaka } from "@waafa/shared";
import { InfoCard } from "@/components/content/InfoCard";
import { PageHero } from "@/components/content/PageHero";
import { SampleBadge } from "@/components/content/SampleBadge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Canonical } from "@/components/seo/Canonical";
import { listEmiBanks, listPageBlocks } from "@/lib/data/content";
import { getContactSettings, getEmiSettings } from "@/lib/data/settings";
import { EmiCalculator } from "./_components/EmiCalculator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Emi");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * /emi (Emi, Emi-m): what a monthly plan costs (calculator), how it works (page blocks), partner banks and the rules,
 * all from Admin › Settings › EMI. Interest-free wording appears only when the admin note says so.
 */
export default async function EmiPage() {
  const [settings, banks, blocks, contact, t] = await Promise.all([
    getEmiSettings(),
    listEmiBanks(),
    listPageBlocks("emi"),
    getContactSettings(),
    getTranslations("Emi"),
  ]);
  const tenures = [...settings.tenuresMonths].sort((a, b) => a - b);
  const steps = blocks.filter((block) => block.group === "steps");
  const interestFree = /\b0\s?%/.test(settings.interestNote ?? "");

  return (
    <main id="main" className="site-container flex flex-col gap-10 pt-4 pb-28 md:gap-14 md:pt-6">
      <Canonical path="/emi" />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: t("kicker") }]} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-x-12 lg:gap-y-10">
          <PageHero
            kicker={t("kicker")}
            title={t("title")}
            lead={t("lead", { min: tenures[0] ?? 3, max: tenures[tenures.length - 1] ?? 12 })}
            aside={settings.sample ? <SampleBadge label={t("sample")} /> : null}
          >
            {settings.interestNote ? (
              <p className="max-w-[60ch] rounded-2xl bg-electric-50 p-4 text-[14.5px] text-navy-900">
                {settings.interestNote}
              </p>
            ) : null}
          </PageHero>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <EmiCalculator
              minimum={settings.minimumAmount}
              tenures={tenures}
              interestFree={interestFree}
              whatsappE164={contact.whatsappE164}
              labels={{
                title: t("calculator"),
                amount: t("amount"),
                amountValue: t("amountValue", { amount: "{amount}" }),
                months: t("months"),
                monthsOption: t("monthsOption", { months: "{months}" }),
                perMonth: t("perMonth"),
                times: t("times", { months: "{months}" }),
                rows: {
                  amount: t("rows.amount"),
                  interest: t("rows.interest"),
                  fee: t("rows.fee"),
                  feeValue: t("rows.feeValue"),
                  total: t("rows.total"),
                },
                ask: t("ask"),
                askMessage: t("askMessage", { amount: "{amount}", months: "{months}" }),
              }}
            />
          </div>
          {steps.length > 0 ? (
            <section aria-labelledby="emi-how" className="flex flex-col gap-4 lg:col-start-1">
              <h2 id="emi-how" className="type-h3 text-navy-900">
                {t("howTitle")}
              </h2>
              <ol className="flex flex-col gap-4">
                {steps.map((block) => (
                  <li key={block.id}>
                    <InfoCard block={block} variant="row" />
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="emi-banks"
          className="flex flex-col gap-3 rounded-[24px] border border-mist-200 bg-white p-6"
        >
          <h2 id="emi-banks" className="font-display text-[20px] font-extrabold text-navy-900">
            {t("banksTitle")}
          </h2>
          {banks.length > 0 ? (
            <ul className="flex flex-col divide-y divide-mist-100">
              {banks.map((bank) => (
                <li key={bank.id} className="flex flex-col gap-0.5 py-3">
                  <span className="font-semibold text-navy-900">{bank.name}</span>
                  <span className="text-[13.5px] text-mist-700">
                    {t("bankMonths", { months: bank.tenuresMonths.join(", ") })}
                    {bank.note ? ` · ${bank.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14.5px] text-mist-700">{t("banksEmpty")}</p>
          )}
        </section>
        <section
          aria-labelledby="emi-rules"
          className="flex flex-col gap-3 rounded-[24px] border border-mist-200 bg-white p-6"
        >
          <h2 id="emi-rules" className="font-display text-[20px] font-extrabold text-navy-900">
            {t("rulesTitle")}
          </h2>
          <dl className="flex flex-col divide-y divide-mist-100 text-[14.5px]">
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-mist-700">{t("rules.minimum")}</dt>
              <dd className="font-semibold text-ink-900 tabular-nums">
                {formatTaka(settings.minimumAmount)}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-mist-700">{t("rules.months")}</dt>
              <dd className="font-semibold text-ink-900">{tenures.join(", ")}</dd>
            </div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-mist-700">{t("rules.cards")}</dt>
              <dd className="font-semibold text-ink-900 sm:text-right">{settings.cardsNote}</dd>
            </div>
            <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="text-mist-700">{t("rules.appliesTo")}</dt>
              <dd className="font-semibold text-ink-900 sm:text-right">{settings.appliesTo}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
