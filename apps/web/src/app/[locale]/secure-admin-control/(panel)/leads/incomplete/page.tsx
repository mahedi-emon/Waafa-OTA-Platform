import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { ExternalLink } from "@/components/icons/server/ExternalLink";
import { Phone } from "@/components/icons/server/Phone";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { displayPhone, formatDhakaDateTime, whatsappHref } from "@/lib/admin/format";
import { IncompleteActions } from "./_components/IncompleteActions";

const PATH = "/secure-admin-control/leads/incomplete";

type IncompleteList = {
  total: number;
  items: Array<{
    id: string;
    module: string;
    name: string;
    phone: string;
    email: string | null;
    page: string;
    createdAt: string;
    outcome: "contacted" | "dismissed" | null;
    outcomeBy: string | null;
    reminderSent: boolean;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.incomplete");
  return { title: t("metaTitle") };
}

async function IncompleteView({
  searchParams,
}: Pick<PageProps<"/[locale]/secure-admin-control/leads/incomplete">, "searchParams">) {
  await requireStaff();
  const search = await searchParams;
  const view = search.view === "done" ? "done" : "open";
  const [list, t, tm] = await Promise.all([
    adminGet<IncompleteList>("/admin/leads/incomplete", { view, pageSize: "100" }),
    getTranslations("Admin.incomplete"),
    getTranslations("Admin.modules"),
  ]);
  const moduleName = (key: string) => (tm.has(key as "flights") ? tm(key as "flights") : key);
  return (
    <>
      <AdminPageHeader
        back={{ href: "/secure-admin-control/leads", label: t("back") }}
        title={t("title")}
        lead={t("lead")}
      />
      <StatusTabs
        label={t("tabsLabel")}
        current={view}
        items={[
          { value: "open", label: t("open"), href: PATH },
          { value: "done", label: t("done"), href: `${PATH}?view=done` },
        ]}
      />
      {list.items.length === 0 ? (
        <AdminEmpty
          title={t(view === "open" ? "emptyTitle" : "emptyDoneTitle")}
          body={t("emptyBody")}
        />
      ) : (
        <AdminPanel id="incomplete-list" title={t("listTitle", { count: list.total })} flush>
          <ul className="divide-y divide-mist-100">
            {list.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-semibold text-ink-900">
                    {item.name}
                    <span className="ml-2 text-[13px] font-normal text-mist-600">
                      {moduleName(item.module)}
                    </span>
                  </p>
                  <p className="text-[13.5px] text-mist-600 tabular-nums">
                    {displayPhone(item.phone)}
                    {item.email ? ` · ${item.email}` : ""} ·{" "}
                    {t("started", { time: formatDhakaDateTime(item.createdAt) })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={item.page}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-[13.5px] font-medium text-brand-700 underline-offset-2 hover:underline"
                    >
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                      {t("page")}
                    </a>
                    {item.reminderSent ? <Badge variant="neutral">{t("reminded")}</Badge> : null}
                    {item.outcome ? (
                      <Badge variant={item.outcome === "contacted" ? "success" : "neutral"}>
                        {t(`outcome.${item.outcome}`, { name: item.outcomeBy ?? "" })}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a href={`tel:${item.phone}`}>
                      <Phone aria-hidden="true" className="size-4" />
                      {t("call")}
                    </a>
                  </Button>
                  <Button asChild variant="whatsapp" size="sm">
                    <a
                      href={whatsappHref(item.phone, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsAppIcon className="size-4" />
                      {t("whatsapp")}
                    </a>
                  </Button>
                  {item.outcome ? null : (
                    <IncompleteActions
                      id={item.id}
                      strings={{
                        contacted: t("contacted"),
                        dismiss: t("dismiss"),
                        done: t("saved"),
                        failed: t("failed"),
                      }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </>
  );
}

/**
 * Incomplete requests (FR-FLT-08, issue 250): visitors who finished step 1, agreed to a call and didn't send the
 * request. Shown 30 minutes after step 1; call or WhatsApp them, then mark them contacted or set them aside.
 */
export default function IncompletePage(
  props: PageProps<"/[locale]/secure-admin-control/leads/incomplete">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
      <IncompleteView searchParams={props.searchParams} />
    </Suspense>
  );
}
