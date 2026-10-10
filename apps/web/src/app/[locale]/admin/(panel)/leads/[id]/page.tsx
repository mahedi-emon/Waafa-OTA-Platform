import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LeadPrioritySchema, LeadStatusSchema } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { JsonDetails } from "@/components/admin/JsonDetails";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { flattenForDisplay } from "@/lib/admin/flatten";
import { displayPhone, formatDhakaDateTime, taka, whatsappHref } from "@/lib/admin/format";
import type { LeadDetail, StaffDirectoryEntry } from "@/lib/admin/types";
import { LeadControls } from "./_components/LeadControls";
import { NoteForm } from "./_components/NoteForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.leads");
  return { title: t("metaTitle") };
}

const ACTIVITY_TYPES = [
  "created",
  "note",
  "status",
  "assign",
  "call",
  "email",
  "whatsapp",
  "converted",
];

async function Lead({ params }: { params: PageProps<"/[locale]/admin/leads/[id]">["params"] }) {
  const { id } = await params;
  const [lead, staff, t, tl, tc, tm, ts, tp] = await Promise.all([
    adminGet<LeadDetail>(`/admin/leads/${encodeURIComponent(id)}`),
    adminGet<StaffDirectoryEntry[]>("/admin/staff"),
    getTranslations("Admin.lead"),
    getTranslations("Admin.leads"),
    getTranslations("Admin.common"),
    getTranslations("Admin.modules"),
    getTranslations("Admin.statuses"),
    getTranslations("Admin.priorities"),
  ]);
  const rows = flattenForDisplay(lead.payload, { yes: tc("yes"), no: tc("no") });
  const whatsappText = t("whatsappText", { name: lead.contact.name, reference: lead.reference });

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/leads", label: tl("title") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{lead.reference}</span>
            <LeadStatusBadge status={lead.status} label={ts(lead.status)} />
          </span>
        }
        lead={`${tm(lead.module)} · ${lead.summary}`}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <AdminPanel>
            <LeadControls
              id={lead.id}
              status={lead.status}
              priority={lead.priority}
              assigneeId={lead.assignee?.id ?? null}
              statuses={LeadStatusSchema.options.map((value) => ({ value, label: ts(value) }))}
              priorities={LeadPrioritySchema.options.map((value) => ({ value, label: tp(value) }))}
              staff={staff.map((person) => ({ value: person.id, label: person.name }))}
              strings={{
                status: t("status"),
                assignee: t("assignee"),
                priority: t("priority"),
                unassigned: tl("unassigned"),
                amount: t("amount"),
                amountHint: t("amountHint"),
                reason: t("reason"),
                reasonHint: t("reasonHint"),
                confirm: t("confirmStatus", { status: "{status}" }),
                cancel: tc("cancel"),
                updated: t("updated"),
                failed: tc("unavailable"),
              }}
            />
            <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-mist-100 pt-4 text-[14px] sm:grid-cols-3">
              <div>
                <dt className="text-[12.5px] font-semibold text-mist-600">{t("firstResponse")}</dt>
                <dd>
                  {lead.firstResponseAt ? formatDhakaDateTime(lead.firstResponseAt) : t("notYet")}
                </dd>
              </div>
              {lead.amount !== null ? (
                <div>
                  <dt className="text-[12.5px] font-semibold text-mist-600">{t("amount")}</dt>
                  <dd className="font-semibold tabular-nums">{taka(lead.amount)}</dd>
                </div>
              ) : null}
              {lead.reason ? (
                <div>
                  <dt className="text-[12.5px] font-semibold text-mist-600">{t("reason")}</dt>
                  <dd>{lead.reason}</dd>
                </div>
              ) : null}
            </dl>
            {lead.duplicateOf ? (
              <p className="mt-4 rounded-xl bg-warning-50 p-3 text-[14px] text-warning-700">
                {t("duplicateOf", { reference: lead.duplicateOf.reference })}{" "}
                <Link
                  href={`/admin/leads/${lead.duplicateOf.id}`}
                  prefetch={false}
                  className="font-semibold underline"
                >
                  {tc("open")}
                </Link>
              </p>
            ) : null}
            {lead.repeats.length > 0 ? (
              <p className="mt-3 text-[14px] text-mist-700">
                {t("repeats", {
                  references: lead.repeats.map((item) => item.reference).join(", "),
                })}
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel title={t("request")} lead={t("requestLead")}>
            <JsonDetails
              rows={rows}
              json={JSON.stringify(lead.payload, null, 2)}
              strings={{ readable: t("readable"), raw: t("raw") }}
            />
          </AdminPanel>

          <AdminPanel title={t("timeline")} lead={t("timelineLead")}>
            <NoteForm
              id={lead.id}
              types={(["note", "call", "email", "whatsapp"] as const).map((value) => ({
                value,
                label: t(`noteTypes.${value}`),
              }))}
              strings={{
                type: t("noteType"),
                placeholder: t("notePlaceholder"),
                submit: t("addNote"),
                added: t("noteAdded"),
                failed: tc("unavailable"),
              }}
            />
            <ol className="mt-5 flex flex-col gap-4 border-l-2 border-mist-200 pl-4">
              {lead.activities.toReversed().map((activity) => (
                <li key={activity.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[23px] size-3 rounded-full bg-electric-600 ring-4 ring-white"
                  />
                  <p className="text-[13px] text-mist-600">
                    <span className="font-semibold text-navy-900">{activity.actor}</span> ·{" "}
                    {ACTIVITY_TYPES.includes(activity.type)
                      ? t(`activityTypes.${activity.type}` as "activityTypes.note")
                      : activity.type}{" "}
                    ·{" "}
                    <time dateTime={activity.createdAt}>
                      {formatDhakaDateTime(activity.createdAt)}
                    </time>
                  </p>
                  <p className="mt-0.5 text-[14.5px] whitespace-pre-line text-ink-900">
                    {activity.body}
                  </p>
                </li>
              ))}
            </ol>
          </AdminPanel>
        </div>

        <div className="flex flex-col gap-4">
          <AdminPanel title={t("customer")}>
            <p className="font-display text-[18px] font-bold text-navy-900">{lead.contact.name}</p>
            <dl className="mt-3 flex flex-col gap-2.5 text-[14.5px]">
              <div>
                <dt className="text-[12.5px] font-semibold text-mist-600">{t("phone")}</dt>
                <dd className="tabular-nums">{displayPhone(lead.contact.phone)}</dd>
              </div>
              {lead.contact.email ? (
                <div>
                  <dt className="text-[12.5px] font-semibold text-mist-600">{t("email")}</dt>
                  <dd className="break-all">{lead.contact.email}</dd>
                </div>
              ) : null}
              {lead.contact.preferredContact ? (
                <div>
                  <dt className="text-[12.5px] font-semibold text-mist-600">{t("contactBy")}</dt>
                  <dd>{lead.contact.preferredContact}</dd>
                </div>
              ) : null}
              {lead.contact.bestTime ? (
                <div>
                  <dt className="text-[12.5px] font-semibold text-mist-600">{t("bestTime")}</dt>
                  <dd>{lead.contact.bestTime}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild variant="secondary" size="md" className="w-full">
                <a href={`tel:${lead.contact.phone}`}>
                  <Phone aria-hidden="true" className="size-4" />
                  {t("call")}
                </a>
              </Button>
              <Button asChild variant="whatsapp" size="md" className="w-full">
                <a
                  href={whatsappHref(lead.contact.phone, whatsappText)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-4" />
                  {t("whatsapp")}
                </a>
              </Button>
              {lead.contact.email ? (
                <Button asChild variant="soft" size="md" className="w-full">
                  <a
                    href={`mailto:${lead.contact.email}?subject=${encodeURIComponent(lead.reference)}`}
                  >
                    <Mail aria-hidden="true" className="size-4" />
                    {t("emailWithRef")}
                  </a>
                </Button>
              ) : null}
            </div>
          </AdminPanel>
          <AdminPanel title={t("source")}>
            <dl className="flex flex-col gap-2.5 text-[14.5px]">
              <div>
                <dt className="text-[12.5px] font-semibold text-mist-600">{t("channel")}</dt>
                <dd>{lead.source.channel ?? "web"}</dd>
              </div>
              {lead.source.page ? (
                <div>
                  <dt className="text-[12.5px] font-semibold text-mist-600">{t("page")}</dt>
                  <dd className="break-all">{lead.source.page}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[12.5px] font-semibold text-mist-600">{tl("colAge")}</dt>
                <dd>{formatDhakaDateTime(lead.createdAt)}</dd>
              </div>
            </dl>
          </AdminPanel>
        </div>
      </div>
    </>
  );
}

/** Lead detail (AdminLead, AdminLead-lost, AdminLead-m boards). */
export default function LeadPage(props: PageProps<"/[locale]/admin/leads/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[720px] rounded-2xl" />}>
      <Lead params={props.params} />
    </Suspense>
  );
}
