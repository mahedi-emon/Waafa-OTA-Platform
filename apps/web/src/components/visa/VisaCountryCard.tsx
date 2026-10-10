import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatTaka, type VisaCountry } from "@waafa/shared";
import { Link } from "@/i18n/navigation";

type VisaCountryCardProps = {
  country: VisaCountry;
  /** How the file is lodged ("Embassy", "eVisa"), shown as a chip on the visa list. */
  submissionLabel?: string;
};

/** Visa country card: code mark, name, visa types, the fastest processing time and our lowest service charge. */
async function VisaCountryCard({ country, submissionLabel }: VisaCountryCardProps) {
  const t = await getTranslations("Home.visa");
  const tSearch = await getTranslations("Search.visaTypes");
  const first = country.types[0];
  const fee = Math.min(...country.types.map((type) => type.serviceCharge));

  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4 transition-colors duration-150 hover:border-electric-200">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-8 w-10 shrink-0 place-items-center rounded-md bg-navy-900 font-display text-[12px] font-extrabold tracking-wider text-white"
        >
          {country.flagCode}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[16px] font-bold text-navy-900">
            <Link
              href={`/visa-services/${country.slug}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
            >
              {country.name}
            </Link>
          </h3>
          <p className="truncate text-[12.5px] text-mist-600">
            {country.types.map((type) => tSearch(`${type.type}.label`)).join(" · ")}
          </p>
        </div>
        {submissionLabel ? (
          <span className="shrink-0 self-start rounded-full bg-mist-100 px-2.5 py-1 text-[12px] font-semibold text-ink-900">
            {submissionLabel}
          </span>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-2 text-[13px]">
        <div>
          <dt className="text-mist-600">{t("processing")}</dt>
          <dd className="font-semibold text-ink-900">{first?.processingTime}</dd>
        </div>
        <div>
          <dt className="text-mist-600">{t("fee")}</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">{formatTaka(fee)}</dd>
        </div>
      </dl>
      <span
        aria-hidden="true"
        className="mt-auto inline-flex items-center gap-1 text-[13.5px] font-semibold text-brand-700"
      >
        {t("documents")}
        <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}

export { VisaCountryCard };
