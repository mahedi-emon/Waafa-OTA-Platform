import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Plus } from "@/components/icons/server/Plus";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import {
  CONTENT_MODEL,
  canDelete,
  hasPublishWorkflow,
  isContentKey,
  type ContentKey,
} from "@waafa/shared";
import { listPriceOf, photoOf } from "@waafa/shared/helpers/photo";
import { recordChipsOf } from "@waafa/shared/workflow/chips";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContentEditor } from "@/components/admin/editor/ContentEditor";
import { airlineLogoSrc } from "@/components/travel/airlineLogoSrc";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf, sortOf } from "@/components/admin/table/listQuery";
import type { BulkAction, ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { EDITOR_MESSAGES } from "@/lib/admin/blueprints/editorMessages";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import { chipFilterNames, chipReason } from "@/lib/admin/chipWords";
import { bulkContent } from "@/lib/admin/contentActions";
import { headingOf } from "@/lib/admin/blueprints/display";
import { ADMIN_NAV } from "@/lib/admin/navigation";
import { editorName, formatDhakaDateTime, initialsOf, pageParam, taka } from "@/lib/admin/format";
import { settingsHrefFor } from "@/lib/admin/settingsSections";
import type { ContentRecordsPage, ContentSingleton } from "@/lib/admin/types";
import { SITE_URL } from "@/lib/siteUrl";
import { RecordMoveButtons } from "./_components/RecordMoveButtons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("metaTitle") };
}

type Params = PageProps<"/[locale]/secure-admin-control/content/[key]">;

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const SORTS = ["title.asc", "title.desc", "updated.asc", "updated.desc"] as const;

/** The list query the API reads (ContentListQuerySchema), kept to values it accepts so a typed address never fails. */
function recordsQuery(search: Record<string, string | string[] | undefined>) {
  const q = one(search.q)?.trim().slice(0, 80);
  const chip = one(search.chip);
  const sort = sortOf(search.sort, SORTS);
  return {
    ...(q ? { q } : {}),
    ...(chip && /^[a-zA-Z]{2,20}$/.test(chip) ? { chip } : {}),
    ...(sort ? { sort } : {}),
    page: pageParam(search.page),
    pageSize: pageSizeOf(search.pageSize),
  };
}

/** The airline logo a group fare or an airline record shows in the list, or null. */
function airlineLogoOf(key: string, data: unknown): string | null {
  const record = (data ?? {}) as Record<string, unknown>;
  const airline = (key === "groupFares" ? record.airline : key === "airlines" ? record : null) as {
    code?: unknown;
    logo?: { src?: unknown };
  } | null;
  if (!airline || typeof airline.code !== "string") return null;
  const logo =
    typeof airline.logo?.src === "string" ? { src: airline.logo.src, alt: "" } : undefined;
  return airlineLogoSrc({ code: airline.code, ...(logo ? { logo } : {}) } as Parameters<
    typeof airlineLogoSrc
  >[0]);
}

async function ContentKeyView({ params, searchParams }: Pick<Params, "params" | "searchParams">) {
  const { key } = await params;
  if (!isContentKey(key)) notFound();
  // Settings live in one place (D0 R9): their old addresses open the right settings section.
  const moved = settingsHrefFor(key);
  if (moved) redirect(moved);
  const [staff, t, te, messages, { schema, blueprint }] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.content"),
    getTranslations("Admin.editor.new"),
    getMessages(),
    resolveBlueprint(key),
  ]);
  const title = t(`keys.${key}`);

  if (CONTENT_MODEL[key].kind === "singleton") {
    const data = await adminGet<ContentSingleton>(`/admin/content/${key}`);
    return (
      <>
        <AdminPageHeader
          back={{ href: "/secure-admin-control/settings", label: t("title") }}
          title={title}
          lead={blueprint.intro}
        />
        <NextIntlClientProvider messages={pickMessagePaths(messages, EDITOR_MESSAGES)}>
          <ContentEditor
            mode="setting"
            contentKey={key}
            blueprint={blueprint}
            schema={schema}
            initial={data.value}
            version={data.version}
            updatedAt={data.updatedAt}
            updatedBy={data.updatedBy}
            canAdvanced={staff.roles.includes("super-admin")}
            origin={SITE_URL}
          />
        </NextIntlClientProvider>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        // A list that is a sidebar item has its own breadcrumb; only the others go back to All content.
        {...(inSidebar(key)
          ? {}
          : { back: { href: "/secure-admin-control/content", label: t("title") } })}
        title={title}
        lead={blueprint.intro}
        actions={
          <Button asChild size="sm">
            <Link href={`/secure-admin-control/content/${key}/new`} prefetch={false}>
              <Plus aria-hidden="true" className="size-4" />
              {te("title", { thing: blueprint.nouns.one })}
            </Link>
          </Button>
        }
      />
      <RecordTable contentKey={key} search={await searchParams} />
    </>
  );
}

/** Whether a content list is a sidebar item of its own (its breadcrumb comes from the sidebar). */
const inSidebar = (key: ContentKey) =>
  ADMIN_NAV.some((group) =>
    group.items.some((item) => item.href.split("?")[0] === `/secure-admin-control/content/${key}`),
  );

/** A content list as the shared DataTable (D0 R5): the API searches, filters, sorts and pages it. */
async function RecordTable({
  contentKey: key,
  search,
}: {
  contentKey: ContentKey;
  search: Record<string, string | string[] | undefined>;
}) {
  const [data, t, tc, tchip, te, { blueprint }] = await Promise.all([
    adminGet<ContentRecordsPage>(`/admin/content/${key}/records`, recordsQuery(search)),
    getTranslations("Admin.content.list"),
    getTranslations("Admin.common"),
    getTranslations("Admin.chips"),
    getTranslations("Admin.editor"),
    resolveBlueprint(key),
  ]);
  const actors = {
    sample: te("actors.sample"),
    update: te("actors.update"),
    order: te("actors.order"),
  };
  const now = new Date();
  const path = `/secure-admin-control/content/${key}`;
  const workflow = hasPublishWorkflow(key);
  // Moving a record only makes sense in the order the site uses: no search, filter or other sort.
  const query = recordsQuery(search);
  const inSiteOrder = !query.q && !query.chip && !query.sort;
  const prices = data.items.map(
    (item) => listPriceOf(item.data as Record<string, unknown>) ?? null,
  );
  const hasPrice = prices.some((price) => price !== null);
  const moveStrings = {
    earlier: t("moveEarlier"),
    later: t("moveLater"),
    moved: t("moved"),
    failed: tc("unavailable"),
  };

  const rows: DataRow[] = data.items.map((item, index) => {
    const updated = formatDhakaDateTime(item.updatedAt);
    const photo = photoOf(item.data as Record<string, unknown>);
    const price = prices[index] ?? null;
    // The name staff know it by ("Dhaka → Dubai · Emirates", "Best sellers"), never its key (D0 R10).
    const title = headingOf(blueprint, item.data) || item.title;
    const editor = editorName(item.updatedBy, actors);
    return {
      id: item.id,
      href: `${path}/${encodeURIComponent(item.id)}`,
      title,
      ...(editor ? { subtitle: t("changedBy", { name: editor }) } : {}),
      thumb: photo
        ? { src: photo, alt: "" }
        : (() => {
            // Group fares and airlines show the airline's logo (Admin upload, else the bundled mark; issue 229).
            const logo = airlineLogoOf(key, item.data);
            return logo ? { src: logo, alt: "" } : { initials: initialsOf(title) };
          })(),
      chips: recordChipsOf(
        key,
        item.data,
        now,
        item.uses !== undefined ? { uses: item.uses } : {},
      ).map((chip) => ({
        family: "record" as const,
        name: chip.name,
        label: tchip(`labels.${chip.name}`),
        reason: chipReason(tchip, chip),
      })),
      facts: {
        price: price !== null ? { text: taka(price), kind: "money" } : undefined,
        updated: { text: updated, kind: "date" },
      },
      sample: Boolean((item.data as { sample?: unknown } | null)?.sample),
      summary: [
        ...(price !== null ? [{ label: t("price"), value: taka(price) }] : []),
        { label: t("updated"), value: updated },
      ],
      ...(inSiteOrder
        ? { actions: <RecordMoveButtons contentKey={key} id={item.id} strings={moveStrings} /> }
        : {}),
    };
  });

  // A column shows only when it has something to say on this list (no empty Status or Price columns).
  const hasStatus = rows.some((row) => (row.chips?.length ?? 0) > 0);
  const columns: ColumnSpec[] = [
    { key: "name", label: t("name"), sort: "title", always: true },
    ...(hasStatus ? [{ key: "status", label: t("status"), always: true }] : []),
    ...(hasPrice ? [{ key: "price", label: t("price"), align: "end" as const }] : []),
    { key: "updated", label: t("updated"), sort: "updated" },
  ];
  const chipNames = chipFilterNames(
    key,
    data.items[0]?.data as Record<string, unknown> | undefined,
  );
  const bulk: BulkAction[] = [
    ...(workflow
      ? [
          { id: "publish", label: t("publish"), run: bulkContent.bind(null, key, "publish") },
          { id: "unpublish", label: t("unpublish"), run: bulkContent.bind(null, key, "unpublish") },
          { id: "archive", label: t("archive"), run: bulkContent.bind(null, key, "archive") },
        ]
      : []),
    ...(canDelete(key)
      ? [
          {
            id: "trash",
            label: t("trash"),
            danger: true,
            // The bulk bar puts the number in: the words keep {count} (compiled messages have no t.raw).
            confirm: t("trashConfirm", { count: "{count}" }),
            run: bulkContent.bind(null, key, "trash"),
          },
        ]
      : []),
  ];

  return (
    <AdminDataTable
      listKey={`content-${key}`}
      path={path}
      rows={rows}
      columns={columns}
      page={{ total: data.total, page: data.page, pageSize: data.pageSize }}
      searchLabel={tc("search")}
      filters={
        chipNames.length > 0
          ? [
              {
                param: "chip",
                label: t("filter"),
                options: chipNames.map((name) => ({ value: name, label: tchip(`labels.${name}`) })),
              },
            ]
          : []
      }
      bulk={bulk}
      openLabel={t("open")}
      empty={{ title: t("emptyTitle"), body: t("emptyBody") }}
    />
  );
}

/** One content area: a setting's editor, or its records as the shared DataTable (form engine v2 D0 R2, table R5). */
export default function ContentKeyPage(props: Params) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <ContentKeyView params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
