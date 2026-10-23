import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { isContentKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContentEditor } from "@/components/admin/editor/ContentEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { EDITOR_MESSAGES } from "@/lib/admin/blueprints/editorMessages";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { recordChipsOf, type RecordChip } from "@/lib/admin/recordChips";
import type { ContentCollection, ContentSingleton } from "@/lib/admin/types";
import { SITE_URL } from "@/lib/siteUrl";
import { RecordList } from "./_components/RecordList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("metaTitle") };
}

async function ContentKeyView({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/content/[key]">["params"];
}) {
  const { key } = await params;
  if (!isContentKey(key)) notFound();
  const [data, staff, t, tc, te, tt, tchip, messages, { schema, blueprint }] = await Promise.all([
    adminGet<ContentSingleton | ContentCollection>(`/admin/content/${key}`),
    requireStaff(),
    getTranslations("Admin.content"),
    getTranslations("Admin.common"),
    getTranslations("Admin.editor.new"),
    getTranslations("Admin.editor.toast"),
    getTranslations("Admin.chips"),
    getMessages(),
    resolveBlueprint(key),
  ]);
  const now = new Date();
  /** Why a row has its chip, with the date or number it names (D0 R4). */
  const chipReason = (chip: RecordChip): string => {
    const date = (iso: string) => formatDhakaDateTime(iso);
    switch (chip.name) {
      case "scheduled":
      case "expired":
      case "ended":
        return chip.at ? tchip(`reasons.${chip.name}`, { date: date(chip.at) }) : "";
      case "live":
        return chip.at
          ? tchip("reasons.liveSince", { date: date(chip.at) })
          : chip.until
            ? tchip("reasons.liveUntil", { date: date(chip.until) })
            : tchip("reasons.live");
      case "active":
        return chip.until
          ? tchip("reasons.activeUntil", { date: date(chip.until) })
          : tchip("reasons.active");
      case "open":
        return chip.until
          ? tchip("reasons.openUntil", { date: date(chip.until) })
          : tchip("reasons.open");
      case "usedUp":
      case "fewSeats":
        return tchip(`reasons.${chip.name}`, { count: chip.count ?? 0 });
      default:
        return tchip(`reasons.${chip.name}`);
    }
  };
  const title = t(`keys.${key}`);

  if (data.kind === "singleton") {
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
        back={{ href: "/secure-admin-control/content", label: t("title") }}
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
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <RecordList
          key={data.items.map((item) => item.id).join("|")}
          contentKey={key}
          items={data.items.map((item) => ({
            id: item.id,
            title: item.title,
            updatedAt: item.updatedAt,
            updatedBy: item.updatedBy,
            sample: Boolean((item.data as { sample?: unknown } | null)?.sample),
            chips: recordChipsOf(key, item.data, now, {
              ...(item.uses !== undefined ? { uses: item.uses } : {}),
            }).map((chip) => ({
              name: chip.name,
              label: tchip(`labels.${chip.name}`),
              reason: chipReason(chip),
            })),
          }))}
          strings={{
            search: t("search"),
            edit: tc("edit"),
            delete: tc("delete"),
            deleteConfirm: t("deleteConfirm", { title: "{title}" }),
            deleted: t("deleted"),
            moveUp: t("moveUp"),
            moveDown: t("moveDown"),
            orderSaved: t("orderSaved"),
            failed: tc("unavailable"),
            sample: tc("sample"),
            empty: t("emptyList"),
            updated: tc("updated", { time: "{time}" }),
            undo: tt("undo"),
            restored: tt("backFromTrash"),
          }}
        />
      </section>
    </>
  );
}

/** One content area: a setting's editor, or the list of records (form engine v2, D0 R2; the list becomes R5's table). */
export default function ContentKeyPage(
  props: PageProps<"/[locale]/secure-admin-control/content/[key]">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <ContentKeyView params={props.params} />
    </Suspense>
  );
}
