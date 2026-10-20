import { Suspense } from "react";
import type { Metadata } from "next";
import { Check, LayoutGrid, List, Search } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { MediaList } from "@waafa/shared";
import { cn } from "cn";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, hasRole, requireStaff } from "@/lib/admin/adminApi";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
import type { ContentCollection } from "@/lib/admin/types";
import { MediaBrowser } from "./_components/MediaBrowser";
import { MediaLibraryUploader } from "./_components/MediaLibraryUploader";
import { SiteImages } from "./_components/SiteImages";

const PATH = "/secure-admin-control/media";

type Filters = {
  tab: "library" | "site";
  q: string;
  kind: "photo" | "video" | undefined;
  unused: boolean;
  view: "grid" | "list";
};

/** The library's address with these filters (URL state: every view is a shareable link). */
function hrefOf(filters: Filters, change: Partial<Filters> = {}): string {
  const next = { ...filters, ...change };
  const params = new URLSearchParams();
  if (next.tab === "site") params.set("tab", "site");
  else {
    if (next.q) params.set("q", next.q);
    if (next.kind) params.set("kind", next.kind);
    if (next.unused) params.set("unused", "true");
    if (next.view === "list") params.set("view", "list");
  }
  const search = params.toString();
  return search ? `${PATH}?${search}` : PATH;
}

const chip = (active: boolean) =>
  cn(
    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors duration-150",
    active
      ? "bg-navy-900 text-white"
      : "bg-white text-navy-900 ring-1 ring-mist-200 hover:bg-mist-50",
  );

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.mediaLibrary");
  return { title: t("metaTitle") };
}

async function MediaLibrary({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/media">["searchParams"];
}) {
  const params = await searchParams;
  const [staff, t, tc, messages] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.mediaLibrary"),
    getTranslations("Admin.common"),
    getMessages(),
  ]);
  const editsSite = hasRole(staff, "admin", "content-editor");
  const filters: Filters = {
    tab: params.tab === "site" && editsSite ? "site" : "library",
    q: typeof params.q === "string" ? params.q.trim().slice(0, 80) : "",
    kind: params.kind === "photo" || params.kind === "video" ? params.kind : undefined,
    unused: params.unused === "true",
    view: params.view === "list" ? "list" : "grid",
  };
  const page = pageParam(params.page);

  const header = (
    <>
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      {editsSite ? (
        <StatusTabs
          label={t("tabs.label")}
          current={filters.tab}
          items={[
            {
              value: "library",
              label: t("tabs.library"),
              href: hrefOf(filters, { tab: "library" }),
            },
            { value: "site", label: t("tabs.site"), href: hrefOf(filters, { tab: "site" }) },
          ]}
        />
      ) : null}
    </>
  );

  if (filters.tab === "site") {
    const slots = await adminGet<ContentCollection>("/admin/content/mediaSlots");
    return (
      <>
        {header}
        <div className="flex flex-col gap-4">
          <p className="max-w-3xl text-[14.5px] text-mist-600">{t("site.lead")}</p>
          <SiteImages slots={slots.items} />
        </div>
      </>
    );
  }

  const list = await adminGet<MediaList>("/admin/media", {
    page,
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.unused ? { unused: "true" } : {}),
  });
  const filtered = Boolean(filters.q || filters.kind || filters.unused);
  const keyNames = (messages as { Admin: { content: { keys: Record<string, string> } } }).Admin
    .content.keys;

  return (
    <>
      {header}
      <NextIntlClientProvider
        messages={pickMessagePaths(messages, ["Admin.media", "Admin.mediaLibrary"])}
      >
        <div className="flex flex-col gap-5">
          <MediaLibraryUploader />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form role="search" action={PATH} className="flex w-full max-w-md gap-2">
              <label htmlFor="media-search" className="sr-only">
                {t("search")}
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mist-500"
                />
                <Input
                  id="media-search"
                  type="search"
                  name="q"
                  defaultValue={filters.q}
                  placeholder={t("search")}
                  className="h-11 pl-9"
                />
              </div>
              {filters.kind ? <input type="hidden" name="kind" value={filters.kind} /> : null}
              {filters.unused ? <input type="hidden" name="unused" value="true" /> : null}
              {filters.view === "list" ? <input type="hidden" name="view" value="list" /> : null}
              <Button type="submit" variant="secondary">
                {t("searchButton")}
              </Button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav
                aria-label={t("filters.label")}
                className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
              >
                {(
                  [
                    ["all", undefined],
                    ["photo", "photo"],
                    ["video", "video"],
                  ] as const
                ).map(([name, kind]) => (
                  <Link
                    key={name}
                    href={hrefOf(filters, { kind })}
                    prefetch={false}
                    aria-current={filters.kind === kind ? "true" : undefined}
                    className={chip(filters.kind === kind)}
                  >
                    {t(`filters.${name}`)}
                  </Link>
                ))}
                <Link
                  href={hrefOf(filters, { unused: !filters.unused })}
                  prefetch={false}
                  aria-current={filters.unused ? "true" : undefined}
                  className={chip(filters.unused)}
                >
                  {filters.unused ? <Check aria-hidden="true" className="size-4" /> : null}
                  {t("filters.unused")}
                </Link>
              </nav>
              <nav
                aria-label={t("views.label")}
                className="flex gap-1 rounded-full bg-mist-100 p-1"
              >
                {(
                  [
                    ["grid", LayoutGrid],
                    ["list", List],
                  ] as const
                ).map(([view, Icon]) => (
                  <Link
                    key={view}
                    href={hrefOf(filters, { view })}
                    prefetch={false}
                    aria-current={filters.view === view ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold",
                      filters.view === view
                        ? "bg-white text-navy-900 shadow-sm"
                        : "text-mist-600 hover:text-navy-900",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {t(`views.${view}`)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <section aria-label={t("title")} className="flex flex-col gap-4">
            <p className="text-[13.5px] text-mist-600" aria-live="polite">
              {t("count", { count: list.total })}
            </p>
            {list.items.length === 0 ? (
              <div className="rounded-2xl border border-mist-200 bg-white">
                <AdminEmpty
                  title={filtered ? t("noMatchTitle") : t("emptyTitle")}
                  body={filtered ? t("noMatchBody") : t("emptyBody")}
                  {...(filtered
                    ? {
                        action: (
                          <Button asChild variant="secondary" size="sm">
                            <Link href={PATH} prefetch={false}>
                              {t("clearFilters")}
                            </Link>
                          </Button>
                        ),
                      }
                    : {})}
                />
              </div>
            ) : (
              <MediaBrowser
                items={list.items.map((item) => ({
                  ...item,
                  createdLabel: formatDhakaDateTime(item.createdAt),
                }))}
                view={filters.view}
                canDelete={editsSite}
                keyNames={keyNames}
              />
            )}
            {list.total > list.pageSize ? (
              <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
                <AdminPagination
                  page={list.page}
                  pageSize={list.pageSize}
                  total={list.total}
                  path={PATH}
                  query={{
                    q: filters.q || undefined,
                    kind: filters.kind,
                    unused: filters.unused ? "true" : undefined,
                    view: filters.view === "list" ? "list" : undefined,
                  }}
                  strings={{
                    previous: tc("previous"),
                    next: tc("next"),
                    summary: tc("showing", { shown: list.items.length, total: list.total }),
                  }}
                />
              </div>
            ) : null}
          </section>
        </div>
      </NextIntlClientProvider>
    </>
  );
}

/**
 * Admin › Media library v2 (D0 R3, ADMIN.md §5.7): every photo and video in one place, uploaded many at a time,
 * found by words or filters, with the places each one shows; Site images lists the fixed places on the site.
 */
export default function MediaLibraryPage(props: PageProps<"/[locale]/secure-admin-control/media">) {
  return (
    <Suspense fallback={<Skeleton className="h-120 rounded-2xl" />}>
      <MediaLibrary searchParams={props.searchParams} />
    </Suspense>
  );
}
