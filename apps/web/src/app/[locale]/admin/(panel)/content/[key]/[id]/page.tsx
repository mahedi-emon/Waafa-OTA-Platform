import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CONTENT_MODEL, isContentKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SchemaEditor } from "@/components/admin/schema/SchemaEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { saveRecord } from "@/lib/admin/contentActions";
import { editorSchema, getEditorStrings } from "@/lib/admin/editorStrings";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { summaryOf } from "@/lib/admin/schema";
import type { ContentRecordResponse } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("metaTitle") };
}

async function RecordView({
  params,
}: {
  params: PageProps<"/[locale]/admin/content/[key]/[id]">["params"];
}) {
  const { key, id } = await params;
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "collection") notFound();
  const recordId = decodeURIComponent(id);
  const [record, t, strings] = await Promise.all([
    adminGet<ContentRecordResponse>(`/admin/content/${key}/${encodeURIComponent(recordId)}`),
    getTranslations("Admin.content"),
    getEditorStrings(),
  ]);
  const sample = Boolean((record.data as { sample?: unknown } | null)?.sample);

  return (
    <>
      <AdminPageHeader
        back={{ href: `/admin/content/${key}`, label: t(`keys.${key}`) }}
        title={summaryOf(record.data) || recordId}
        lead={t("lastSavedAt", { time: formatDhakaDateTime(record.updatedAt) })}
      />
      {sample ? (
        <p className="mb-4 rounded-2xl bg-warning-50 p-4 text-[14px] text-warning-700">
          {t("sampleNote")}
        </p>
      ) : null}
      <AdminPanel>
        <SchemaEditor
          schema={editorSchema(key)}
          initial={record.data}
          version={record.version}
          onSave={saveRecord.bind(null, key, recordId)}
          recordBase={`/admin/content/${key}/`}
          recordId={recordId}
          strings={strings}
        />
      </AdminPanel>
    </>
  );
}

/** Edit one record of a content list (D138). */
export default function ContentRecordPage(props: PageProps<"/[locale]/admin/content/[key]/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[720px] rounded-2xl" />}>
      <RecordView params={props.params} />
    </Suspense>
  );
}
