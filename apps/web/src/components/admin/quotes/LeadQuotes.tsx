import { FilePlus2 } from "@/components/icons/server/FilePlus2";
import { getTranslations } from "next-intl/server";
import type { QuoteSummary } from "@waafa/shared";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPlainDate, taka } from "@/lib/admin/format";
import { quoteBadge } from "./quoteBadge";

const ADMIN = "/secure-admin-control";

type LeadQuotesProps = {
  leadId: string;
  quotes: QuoteSummary[];
  /** Booked, lost, cancelled or spam: no new quotes until the lead is reopened. */
  closed: boolean;
  className?: string;
};

/** The lead's quotes (issue 298): each with its state, options and price, and "Write a quote" while the lead is open. */
async function LeadQuotes({ leadId, quotes, closed, className }: LeadQuotesProps) {
  const t = await getTranslations("Admin.quotes");
  return (
    <AdminPanel
      id="lead-quotes"
      title={t("card.title")}
      lead={t("card.lead")}
      className={className}
      action={
        closed ? null : (
          <Button asChild size="sm" variant="secondary">
            <Link href={`${ADMIN}/quotes/new?lead=${leadId}`} prefetch={false}>
              <FilePlus2 aria-hidden="true" />
              {t("card.new")}
            </Link>
          </Button>
        )
      }
    >
      {quotes.length === 0 ? (
        <p className="text-[14px] text-mist-600">{closed ? t("card.closed") : t("card.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-mist-100">
          {quotes.map((quote) => {
            const badge = quoteBadge(quote.status, quote.expired);
            return (
              <li key={quote.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 py-3">
                <Link
                  href={`${ADMIN}/quotes/${quote.id}`}
                  prefetch={false}
                  className="font-semibold text-brand-700 underline-offset-4 hover:underline"
                >
                  {quote.reference}
                </Link>
                <Badge variant={badge.variant}>{t(`statuses.${badge.state}`)}</Badge>
                <p className="w-full text-[13.5px] text-mist-600 tabular-nums">
                  {quote.accepted
                    ? t("card.accepted", {
                        title: quote.accepted.title,
                        price: taka(quote.accepted.price),
                      })
                    : t("card.options", { count: quote.options, price: taka(quote.lowest) })}
                  {" · "}
                  {t("card.validUntil", { date: formatPlainDate(quote.validUntil) })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPanel>
  );
}

export { LeadQuotes };
