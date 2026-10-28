import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QuoteEditor } from "@/components/admin/quotes/QuoteEditor";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFind } from "@/lib/admin/adminApi";
import { dhakaDayFromNow } from "@/lib/admin/format";
import { editorLabels } from "@/lib/admin/quoteLabels";
import type { LeadDetail } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.quotes");
  return { title: t("newTitle") };
}

async function NewQuote({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/quotes/new">["searchParams"];
}) {
  const [search, t] = await Promise.all([searchParams, getTranslations("Admin.quotes")]);
  const leadId = typeof search.lead === "string" ? search.lead : "";
  const lead = /^[a-z0-9]{10,40}$/.test(leadId)
    ? await adminFind<LeadDetail>(`/admin/leads/${leadId}`)
    : null;
  if (!lead) return <AdminNotFound />;
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <AdminPageHeader
        title={t("newTitle")}
        lead={t("newLead", { reference: lead.reference, name: lead.contact.name })}
      />
      <p className="text-sm text-mist-600">
        <Link
          href={`/secure-admin-control/leads/${lead.id}`}
          prefetch={false}
          className="font-semibold text-brand-700 underline-offset-4 hover:underline"
        >
          {t("fromLead", { reference: lead.reference })}
        </Link>
        {` · ${lead.summary}`}
      </p>
      <QuoteEditor
        target={{ leadId: lead.id }}
        options={[]}
        validUntil={dhakaDayFromNow(3)}
        notes={null}
        today={dhakaDayFromNow()}
        labels={await editorLabels("create")}
      />
    </div>
  );
}

/** Admin › a lead › Write a quote (issue 298): the options, the last valid day and a note; saving opens the quote. */
export default function NewQuotePage(
  props: PageProps<"/[locale]/secure-admin-control/quotes/new">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[520px] rounded-2xl" />}>
      <NewQuote searchParams={props.searchParams} />
    </Suspense>
  );
}
