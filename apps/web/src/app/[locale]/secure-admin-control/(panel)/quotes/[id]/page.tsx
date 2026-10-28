import { Suspense } from "react";
import type { Metadata } from "next";
import { CircleCheck } from "@/components/icons/server/CircleCheck";
import { getTranslations } from "next-intl/server";
import type { QuoteView } from "@waafa/shared";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { QuoteEditor } from "@/components/admin/quotes/QuoteEditor";
import { QuoteSendPanel } from "@/components/admin/quotes/QuoteSendPanel";
import { quoteBadge } from "@/components/admin/quotes/quoteBadge";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFind } from "@/lib/admin/adminApi";
import { dhakaDayFromNow, formatDhakaDateTime, formatPlainDate, taka } from "@/lib/admin/format";
import { editorLabels } from "@/lib/admin/quoteLabels";

const ADMIN = "/secure-admin-control";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.quotes");
  return { title: t("metaTitle") };
}

async function Quote({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/quotes/[id]">["params"];
}) {
  const [{ id }, t, tc] = await Promise.all([
    params,
    getTranslations("Admin.quotes"),
    getTranslations("Admin.common"),
  ]);
  const quote = /^[a-z0-9]{10,40}$/.test(id)
    ? await adminFind<QuoteView>(`/admin/quotes/${id}`)
    : null;
  if (!quote) return <AdminNotFound />;
  const badge = quoteBadge(quote.status, quote.expired);
  const open = quote.status === "draft" || quote.status === "sent";
  const accepted = quote.options.find((option) => option.id === quote.acceptedOptionId) ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AdminPageHeader
        title={`${quote.reference} · ${quote.customerName}`}
        status={<Badge variant={badge.variant}>{t(`statuses.${badge.state}`)}</Badge>}
        lead={`${t("card.validUntil", { date: formatPlainDate(quote.validUntil) })} · ${quote.leadSummary}`}
      />
      <p className="text-sm text-mist-600">
        <Link
          href={`${ADMIN}/leads/${quote.leadId}`}
          prefetch={false}
          className="font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          {t("fromLead", { reference: quote.leadReference })}
        </Link>
        {quote.updatedBy
          ? ` · ${t("updated", { time: formatDhakaDateTime(quote.updatedAt), name: quote.updatedBy })}`
          : null}
      </p>

      {accepted && quote.acceptedAt ? (
        <section
          aria-labelledby="quote-accepted"
          className="flex min-w-0 gap-3 rounded-2xl border border-success-600/25 bg-success-50 p-5"
        >
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success-600" />
          <div className="min-w-0">
            <h2 id="quote-accepted" className="font-display text-lg font-bold text-navy-900">
              {t("accepted.title")}
            </h2>
            <p className="text-[14px] text-ink-900">
              {t("accepted.body", {
                title: accepted.title,
                price: taka(accepted.price),
                time: formatDhakaDateTime(quote.acceptedAt),
              })}
            </p>
            <Link
              href={`${ADMIN}/leads/${quote.leadId}`}
              prefetch={false}
              className="mt-2 inline-block font-semibold text-brand-700 underline-offset-4 hover:underline"
            >
              {t("accepted.openLead")}
            </Link>
          </div>
        </section>
      ) : null}

      <AdminPanel id="quote-send" title={t("send.title")} lead={t("send.lead")}>
        {quote.sentAt ? (
          <p className="mb-3 text-[13.5px] text-mist-600">
            {t("send.sentVia", {
              time: formatDhakaDateTime(quote.sentAt),
              channels: quote.sentVia.map((channel) => t(`send.channels.${channel}`)).join(", "),
            })}
          </p>
        ) : null}
        {quote.expired ? (
          <p className="mb-3 text-[13.5px] font-medium text-warning-700">{t("send.expired")}</p>
        ) : null}
        <QuoteSendPanel
          id={quote.id}
          canSend={open && !quote.expired}
          canWithdraw={open}
          email={quote.customerEmail}
          whatsapp={quote.whatsapp}
          link={quote.link}
          pdfHref={`${ADMIN}/api/quotes/${quote.id}/pdf`}
          labels={{
            email: t("send.email"),
            emailTo: t("send.emailTo", { email: "{email}" }),
            noEmail: t("send.noEmail"),
            whatsapp: t("send.whatsapp"),
            linkLabel: t("send.linkLabel"),
            linkHint: t("send.linkHint"),
            copy: t("send.copy"),
            copied: t("send.copied"),
            pdf: t("send.pdf"),
            sent: t("send.sent"),
            withdraw: t("send.withdraw"),
            withdrawConfirm: t("send.withdrawConfirm"),
            withdrawn: t("send.withdrawn"),
            cancel: tc("cancel"),
            failed: t("send.failed"),
          }}
        />
      </AdminPanel>

      {open ? (
        <QuoteEditor
          target={{ quoteId: quote.id }}
          options={quote.options}
          validUntil={quote.validUntil}
          notes={quote.notes}
          today={dhakaDayFromNow()}
          labels={await editorLabels("save")}
        />
      ) : (
        <AdminPanel
          id="quote-options"
          title={t("editor.title")}
          lead={quote.status === "accepted" ? t("editor.locked") : t("editor.withdrawnNote")}
        >
          <ol className="flex flex-col divide-y divide-mist-100">
            {quote.options.map((option, index) => (
              <li key={option.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold tracking-wide text-mist-600 uppercase">
                    {t("editor.option", { number: index + 1 })}
                  </p>
                  <p className="font-semibold text-ink-900">{option.title}</p>
                  {option.details ? (
                    <p className="text-[14px] text-mist-700">{option.details}</p>
                  ) : null}
                  {option.baggage ? (
                    <p className="text-[14px] text-mist-700">{option.baggage}</p>
                  ) : null}
                </div>
                <p className="font-display text-lg font-bold text-navy-900 tabular-nums">
                  {taka(option.price)}
                </p>
              </li>
            ))}
          </ol>
        </AdminPanel>
      )}
    </div>
  );
}

/** Admin › a quote (issue 298): send it, see what the customer accepted, change it while it is open. */
export default function QuotePage(props: PageProps<"/[locale]/secure-admin-control/quotes/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[520px] rounded-2xl" />}>
      <Quote params={props.params} />
    </Suspense>
  );
}
