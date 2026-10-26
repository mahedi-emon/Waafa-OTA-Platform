import { Suspense } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { LeadPrioritySchema, type ContentOption } from "@waafa/shared";
import { AdminNotFound } from "@/components/admin/AdminNotFound";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { CustomerCard } from "@/components/admin/inbox/CustomerCard";
import { InboxListPane, type InboxPaneItem } from "@/components/admin/inbox/InboxListPane";
import { InboxSplit } from "@/components/admin/inbox/InboxSplit";
import { ReplyTimer } from "@/components/admin/inbox/ReplyTimer";
import { Timeline } from "@/components/admin/inbox/Timeline";
import { LeadActions } from "@/components/admin/LeadActions";
import { LeadFacts } from "@/components/admin/LeadFacts";
import { CustomerFiles } from "@/components/admin/files/CustomerFiles";
import { expectedFiles } from "@/lib/admin/expectedFiles";
import { LeadStatusBadge } from "@/components/admin/LeadStatusBadge";
import { VisaProgressPanel } from "@/components/admin/VisaProgressPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { adminFind, adminGet } from "@/lib/admin/adminApi";
import { ageParts, formatDhakaDateTime, taka, whatsappHref } from "@/lib/admin/format";
import { leadFacts } from "@/lib/admin/leadFacts";
import {
  leadListQuery,
  queueSearch,
  visaListQuery,
  withSearch,
  type SearchParams,
} from "@/lib/admin/queues";
import type {
  LeadDetail,
  LeadList,
  StaffDirectoryEntry,
  VisaApplicationList,
} from "@/lib/admin/types";
import { SITE_URL } from "@/lib/siteUrl";
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
  "quote",
  "converted",
  "visa",
  "overdue",
];

/** Only the lead steps' and the visa panel's words reach the browser (scoped provider, D190). */
const LEAD_MESSAGES = ["Admin.leadActions", "Admin.visaProgress"];
const LEADS = "/secure-admin-control/leads";
const VISA = "/secure-admin-control/visa-applications";

type Params = PageProps<"/[locale]/secure-admin-control/leads/[id]">;

/**
 * The queue beside the lead (D0 R6): the leads list, or Visa applications when the lead was opened from there, with
 * the same filters and page. Null when this role can't read that queue.
 */
async function queueFor(search: SearchParams) {
  if (search.queue === "visa") {
    const query = visaListQuery(search);
    const list = await adminGet<VisaApplicationList>("/admin/visa-applications", query).catch(
      () => null,
    );
    return list
      ? {
          kind: "visa" as const,
          list,
          search: queueSearch({ queue: "visa", ...query }),
          back: withSearch(VISA, queueSearch(query)),
        }
      : null;
  }
  const query = leadListQuery(search);
  const list = await adminGet<LeadList>("/admin/leads", query).catch(() => null);
  return list
    ? {
        kind: "leads" as const,
        list,
        search: queueSearch(query),
        back: withSearch(LEADS, queueSearch(query)),
      }
    : null;
}

async function Lead({ params, searchParams }: Pick<Params, "params" | "searchParams">) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const [lead, staff, airports, queue, t, tl, tc, tm, ts, tp, tv, to, messages] = await Promise.all(
    [
      adminFind<LeadDetail>(`/admin/leads/${encodeURIComponent(id)}`),
      adminGet<StaffDirectoryEntry[]>("/admin/staff"),
      adminGet<{ items: ContentOption[] }>("/admin/content/airports/options").catch(() => ({
        items: [] as ContentOption[],
      })),
      queueFor(search),
      getTranslations("Admin.lead"),
      getTranslations("Admin.leads"),
      getTranslations("Admin.common"),
      getTranslations("Admin.modules"),
      getTranslations("Admin.statuses"),
      getTranslations("Admin.priorities"),
      getTranslations("Admin.visaProgress"),
      getTranslations("Admin.orders"),
      getMessages(),
    ],
  );
  if (!lead) return <AdminNotFound />;
  // Fact labels and value words are looked up by computed keys, so this translator is used untyped.
  const tf = t as unknown as ((key: string, values?: Record<string, number>) => string) & {
    has: (key: string) => boolean;
  };
  const words = (group: string, value: string | undefined) =>
    value && tf.has(`${group}.${value}`) ? tf(`${group}.${value}`) : value;
  const cityOf = new Map(airports.items.map((airport) => [airport.id, airport.title]));
  const facts = leadFacts(lead.payload, {
    label: (key) => (tf.has(`facts.${key}`) ? tf(`facts.${key}`) : key),
    value: (group, value) =>
      tf.has(`values.${group}.${value}`) ? tf(`values.${group}.${value}`) : undefined,
    // Three messages, not one with empty plural branches: compiled messages must not format to nothing (issue 236).
    travellers: (adults, children, infants) =>
      [
        t("factWords.travellersAdults", { adults }),
        children > 0 ? t("factWords.travellersChildren", { children }) : "",
        infants > 0 ? t("factWords.travellersInfants", { infants }) : "",
      ].join(""),
    flight: (n) => t("factWords.flight", { n }),
    airport: (iata) => (cityOf.has(iata) ? `${cityOf.get(iata)} (${iata})` : iata),
    anyDate: t("factWords.anyDate"),
    files: (count) => t("factWords.files", { count }),
    yes: tc("yes"),
    no: tc("no"),
  });
  const whatsappText = t("whatsappText", { name: lead.contact.name, reference: lead.reference });
  const ageOf = (minutes: number) => {
    const age = ageParts(minutes);
    return age.unit === "minutes"
      ? tl("ageMinutes", { minutes: age.value })
      : age.unit === "hours"
        ? tl("ageHours", { hours: age.value })
        : tl("ageDays", { days: age.value });
  };
  const preference = [
    lead.contact.preferredContact
      ? t("prefers", { channel: words("contactWays", lead.contact.preferredContact) ?? "" })
      : "",
    lead.contact.bestTime ? t("bestTimeLine", { time: lead.contact.bestTime }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const page = lead.source.page;
  const pageHref =
    page && page.startsWith("/") && !page.startsWith("//") ? `${SITE_URL}${page}` : undefined;

  const items: InboxPaneItem[] = !queue
    ? []
    : queue.kind === "visa"
      ? queue.list.items.map((item) => ({
          id: item.id,
          href: withSearch(`${LEADS}/${item.id}`, queue.search),
          title: item.name,
          subtitle: [item.reference, item.country ?? ""].filter(Boolean).join(" · "),
          chips: [
            {
              family: "visa",
              name: item.stage,
              label:
                item.stage === "documentsPending"
                  ? tv("progress", { received: item.received, required: item.required })
                  : tv(`stages.${item.stage}`),
            },
          ],
          meta: ageOf(item.ageMinutes),
        }))
      : queue.list.items.map((item) => ({
          id: item.id,
          href: withSearch(`${LEADS}/${item.id}`, queue.search),
          title: item.name,
          subtitle: `${item.reference} · ${tm(item.module)}`,
          chips: [
            { family: "lead", name: item.status, label: ts(item.status) },
            ...(item.overdue
              ? [{ family: "overdue" as const, name: "overdue", label: tl("views.overdue") }]
              : []),
          ],
          meta: ageOf(item.ageMinutes),
        }));
  const queueTitle = queue?.kind === "visa" ? t("visaApplications") : tl("title");

  const detail = (
    <>
      <AdminPageHeader
        back={{ href: queue?.back ?? LEADS, label: queueTitle }}
        title={lead.contact.name}
        status={
          <span className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} label={ts(lead.status)} />
            <ReplyTimer
              status={lead.status}
              firstResponseAt={lead.firstResponseAt}
              createdAt={lead.createdAt}
              slaMinutes={lead.slaMinutes}
              strings={{
                left: t("replyLeft", { time: "{time}" }),
                over: t("replyOver", { time: "{time}" }),
                reason: t("replyReason", { minutes: lead.slaMinutes }),
                minutes: t("durMinutes", { count: "{count}" }),
                hours: t("durHours", { count: "{count}" }),
                days: t("durDays", { count: "{count}" }),
              }}
            />
          </span>
        }
        lead={`${lead.reference} · ${tm(lead.module)} · ${lead.summary}`}
      />
      {/* Room for the phone's bottom bar; two columns when the detail itself is wide. */}
      <div className="@container pb-24 md:pb-0">
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-[minmax(0,1fr)_320px]">
          <AdminPanel className="@4xl:col-start-1">
            <NextIntlClientProvider messages={pickMessagePaths(messages, LEAD_MESSAGES)}>
              <LeadActions
                id={lead.id}
                status={lead.status}
                phone={lead.contact.phone}
                email={lead.contact.email ?? null}
                whatsappHref={whatsappHref(lead.contact.phone, whatsappText)}
                emailSubject={lead.reference}
              />
            </NextIntlClientProvider>
            <div className="mt-5 border-t border-mist-100 pt-4">
              <LeadControls
                id={lead.id}
                priority={lead.priority}
                assigneeId={lead.assignee?.id ?? null}
                priorities={LeadPrioritySchema.options.map((value) => ({
                  value,
                  label: tp(value),
                }))}
                staff={staff.map((person) => ({ value: person.id, label: person.name }))}
                strings={{
                  assignee: t("assignee"),
                  priority: t("priority"),
                  unassigned: tl("unassigned"),
                  updated: t("updated"),
                  failed: tc("unavailable"),
                }}
              />
            </div>
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
              <p className="mt-4 rounded-xl bg-warning-50 p-3 text-[14px] text-warning-800">
                {t("duplicateOf", { reference: lead.duplicateOf.reference })}{" "}
                <Link
                  href={`${LEADS}/${lead.duplicateOf.id}`}
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

          {lead.visa ? (
            <AdminPanel title={tv("title")} lead={tv("lead")} className="@4xl:col-start-1">
              <NextIntlClientProvider messages={pickMessagePaths(messages, LEAD_MESSAGES)}>
                <VisaProgressPanel
                  id={lead.id}
                  visa={lead.visa}
                  closed={["booked", "lost", "cancelled", "spam"].includes(lead.status)}
                />
              </NextIntlClientProvider>
            </AdminPanel>
          ) : null}

          <AdminPanel title={t("request")} lead={t("requestLead")} className="@4xl:col-start-1">
            <LeadFacts facts={facts} />
          </AdminPanel>

          <CustomerFiles
            owner="lead"
            id={lead.id}
            expected={expectedFiles(lead.payload)}
            className="@4xl:col-start-1"
          />

          <AdminPanel
            title={t("customer")}
            className="@4xl:col-start-2 @4xl:row-span-4 @4xl:row-start-1 @4xl:self-start"
          >
            <CustomerCard
              name={lead.contact.name}
              phone={lead.contact.phone}
              email={lead.contact.email}
              preference={preference || undefined}
              cameIn={t("cameInLine", {
                channel: words("channels", lead.source.channel ?? "web") ?? "",
                time: formatDhakaDateTime(lead.createdAt),
              })}
              pageHref={pageHref}
              others={{
                leadCount: lead.customer.leadCount,
                leads: lead.customer.leads.map((item) => ({
                  id: item.id,
                  reference: item.reference,
                  label: `${tm(item.module)} · ${ts(item.status)}`,
                  createdAt: item.createdAt,
                })),
                orderCount: lead.customer.orderCount,
                orders: lead.customer.orders
                  ? lead.customer.orders.map((item) => ({
                      id: item.id,
                      reference: item.reference,
                      label: `${to(`statuses.${item.status}`)} · ${formatDhakaDateTime(item.createdAt)}`,
                      total: item.total,
                    }))
                  : null,
              }}
              strings={{
                phone: t("phone"),
                email: t("email"),
                cameIn: t("cameIn"),
                page: t("fromPage"),
                otherRequests: t("otherRequests", { count: "{count}" }),
                noOtherRequests: t("noOtherRequests"),
                orders: t("ordersCount", { count: "{count}" }),
                noOrders: t("noOrders"),
                more: t("more", { count: "{count}" }),
                profile: t("profile"),
              }}
            />
          </AdminPanel>

          <AdminPanel title={t("timeline")} lead={t("timelineLead")} className="@4xl:col-start-1">
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
            <div className="mt-5">
              <Timeline
                label={t("timeline")}
                entries={lead.activities.map((activity) => ({
                  id: activity.id,
                  type: activity.type,
                  text: activity.body,
                  actor: activity.actor,
                  at: activity.createdAt,
                }))}
                typeLabel={(type) =>
                  ACTIVITY_TYPES.includes(type)
                    ? t(`activityTypes.${type}` as "activityTypes.note")
                    : t("activityTypes.status")
                }
              />
            </div>
          </AdminPanel>
        </div>
      </div>
    </>
  );

  if (!queue) return detail;
  return (
    <InboxSplit
      id={queue.kind}
      resizeLabel={t("resize")}
      list={
        <InboxListPane
          title={queueTitle}
          allHref={queue.back}
          allLabel={t("paneAll")}
          count={t("queueCount", { shown: items.length, total: queue.list.total })}
          items={items}
          activeId={lead.id}
          empty={t("queueEmpty")}
        />
      }
    >
      {detail}
    </InboxSplit>
  );
}

/** One lead in the inbox (ADMIN.md §5.5, D0 R6): next steps, facts, the customer, the timeline, its queue beside it. */
export default function LeadPage(props: Params) {
  return (
    <Suspense fallback={<Skeleton className="h-180 rounded-2xl" />}>
      <Lead params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
