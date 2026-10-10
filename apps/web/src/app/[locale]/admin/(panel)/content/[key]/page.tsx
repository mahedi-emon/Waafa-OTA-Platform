import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isContentKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SchemaEditor } from "@/components/admin/schema/SchemaEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { saveSetting } from "@/lib/admin/contentActions";
import { editorSchema, getEditorStrings } from "@/lib/admin/editorStrings";
import { formatDhakaDateTime } from "@/lib/admin/format";
import type { ContentCollection, ContentSingleton } from "@/lib/admin/types";
import { RecordList } from "./_components/RecordList";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("metaTitle") };
}

async function ContentKeyView({
  params,
}: {
  params: PageProps<"/[locale]/admin/content/[key]">["params"];
}) {
  const { key } = await params;
  if (!isContentKey(key)) notFound();
  const [data, t, tc, strings] = await Promise.all([
    adminGet<ContentSingleton | ContentCollection>(`/admin/content/${key}`),
    getTranslations("Admin.content"),
    getTranslations("Admin.common"),
    getEditorStrings(),
  ]);
  const title = t(`keys.${key}`);

  if (data.kind === "singleton") {
    return (
      <>
        <AdminPageHeader
          back={{ href: "/admin/content", label: t("title") }}
          title={title}
          lead={t("lastSaved", {
            time: formatDhakaDateTime(data.updatedAt),
            name: data.updatedBy ?? "seed",
          })}
        />
        <AdminPanel>
          <SchemaEditor
            schema={editorSchema(key)}
            initial={data.value}
            version={data.version}
            onSave={saveSetting.bind(null, key)}
            strings={strings}
          />
        </AdminPanel>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/content", label: t("title") }}
        title={title}
        lead={t("records", { count: data.items.length })}
        actions={
          <Button asChild size="sm">
            <Link href={`/admin/content/${key}/new`} prefetch={false}>
              <Plus aria-hidden="true" className="size-4" />
              {t("newRecord")}
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
          }}
        />
      </section>
    </>
  );
}

/** One content area: the settings form, or the list of records (D138). */
export default function ContentKeyPage(props: PageProps<"/[locale]/admin/content/[key]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-2xl" />}>
      <ContentKeyView params={props.params} />
    </Suspense>
  );
}
