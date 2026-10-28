import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleCheck } from "@/components/icons/server/CircleCheck";
import { Clock } from "@/components/icons/server/Clock";
import { FileText } from "@/components/icons/server/FileText";
import { getTranslations } from "next-intl/server";
import { formatDate, formatTaka, whatsappLink, type PublicQuote } from "@waafa/shared";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { QuoteAccept } from "@/components/quotes/QuoteAccept";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getQuote } from "@/lib/data/quotes";
import { getContactSettings } from "@/lib/data/settings";
import { clientKey } from "@/lib/rateLimit";
import { withSocial } from "@/lib/seo/withSocial";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Quote");
  return withSocial({ title: t("metaTitle"), robots: { index: false, follow: false } });
}

const dateOf = (day: string) => formatDate(`${day}T12:00:00+06:00`);

async function QuoteContent({ params }: Pick<PageProps<"/[locale]/quote/[token]">, "params">) {
  const { token } = await params;
  const [quote, contact, t] = await Promise.all([
    getQuote(token, { clientIp: clientKey(await headers()) }),
    getContactSettings(),
    getTranslations("Quote"),
  ]);
  if (!quote) notFound();
  const accepted = quote.options.find((option) => option.id === quote.acceptedOptionId) ?? null;
  const ask = whatsappLink(contact.whatsappE164, t("whatsappText", { reference: quote.reference }));

  return (
    <main id="main" className="site-container pt-6 pb-28 md:pt-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-[13px] font-bold tracking-wide text-brand-700 uppercase">
            {t("eyebrow", { reference: quote.reference })}
          </p>
          <h1 className="font-display text-[28px] leading-tight font-bold text-navy-900 md:text-4xl">
            {t("title", { name: quote.firstName })}
          </h1>
          <p className="text-[16px] text-mist-700">{t("summary", { summary: quote.summary })}</p>
          <div>
            <Badge variant={quote.state === "expired" ? "warning" : "brand"}>
              <Clock aria-hidden="true" />
              {t("validUntil", { date: dateOf(quote.validUntil) })}
            </Badge>
          </div>
        </header>

        <StateNotice quote={quote} acceptedTitle={accepted?.title ?? null} ask={ask} />

        <QuoteAccept
          token={token}
          open={quote.state === "open"}
          acceptedOptionId={quote.acceptedOptionId}
          options={quote.options.map((option, index) => ({
            id: option.id,
            label: t("option", { number: index + 1 }),
            title: option.title,
            details: option.details,
            baggage: option.baggage ? t("baggage", { baggage: option.baggage }) : null,
            price: formatTaka(option.price),
          }))}
          labels={{
            options: t("optionsLabel"),
            pick: t("pick"),
            accept: t("accept"),
            accepting: t("accepting"),
            vat: t("vat"),
            selected: t("selected"),
            failed: t("failed"),
            challenge: t("challenge"),
            conflict: t("conflict"),
            expired: t("expiredTitle"),
          }}
        />

        {quote.notes ? (
          <section
            aria-labelledby="quote-notes"
            className="rounded-2xl border border-mist-200 bg-mist-50 p-4 sm:p-5"
          >
            <h2 id="quote-notes" className="text-[14px] font-bold text-navy-900">
              {t("notes")}
            </h2>
            <p className="mt-1 text-[15px] whitespace-pre-line text-ink-900">{quote.notes}</p>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href={`/api/quotes/${token}/pdf`} target="_blank" rel="noopener">
              <FileText aria-hidden="true" />
              {t("pdf")}
            </a>
          </Button>
          <Button asChild variant="whatsapp">
            <a href={ask} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-4" />
              {t("whatsapp")}
            </a>
          </Button>
        </div>
        <p className="text-[13.5px] text-mist-600">{t("indicative")}</p>
      </div>
    </main>
  );
}

/** Accepted, expired or withdrawn: what happened and what to do next. Nothing while the quote is open. */
async function StateNotice({
  quote,
  acceptedTitle,
  ask,
}: {
  quote: PublicQuote;
  acceptedTitle: string | null;
  ask: string;
}) {
  const t = await getTranslations("Quote");
  if (quote.state === "open") return null;
  if (quote.state === "accepted") {
    return (
      <section
        aria-labelledby="quote-state"
        role="status"
        className="flex gap-3 rounded-2xl border border-success-600/40 bg-success-50 p-4 sm:p-5"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-success-600" />
        <div className="min-w-0">
          <h2 id="quote-state" className="font-display text-lg font-bold text-navy-900">
            {t("acceptedTitle", { title: acceptedTitle ?? quote.reference })}
          </h2>
          <p className="text-[15px] text-ink-900">
            {t("acceptedBody", { reference: quote.reference })}
          </p>
        </div>
      </section>
    );
  }
  const expired = quote.state === "expired";
  return (
    <section
      aria-labelledby="quote-state"
      className="flex flex-col gap-3 rounded-2xl border border-warning-700/30 bg-warning-50 p-4 sm:p-5"
    >
      <div>
        <h2 id="quote-state" className="font-display text-lg font-bold text-navy-900">
          {expired ? t("expiredTitle") : t("withdrawnTitle")}
        </h2>
        <p className="text-[15px] text-ink-900">
          {expired ? t("expiredBody") : t("withdrawnBody")}
        </p>
      </div>
      <div>
        <Button asChild variant="whatsapp">
          <a href={ask} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-4" />
            {t("whatsapp")}
          </a>
        </Button>
      </div>
    </section>
  );
}

/** A customer's quote by its signed link (issue 298): the options, the PDF and Accept. Never indexed. */
export default function QuotePage(props: PageProps<"/[locale]/quote/[token]">) {
  return (
    <Suspense
      fallback={
        <main id="main" className="site-container pt-10 pb-28">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <Skeleton className="h-10 w-2/3 rounded-xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </main>
      }
    >
      <QuoteContent params={props.params} />
    </Suspense>
  );
}
