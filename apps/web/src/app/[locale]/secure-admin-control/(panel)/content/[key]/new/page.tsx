import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CONTENT_MODEL, isContentKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { SchemaEditor } from "@/components/admin/schema/SchemaEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/admin/adminApi";
import { createRecord } from "@/lib/admin/contentActions";
import { editorSchema, getEditorStrings } from "@/lib/admin/editorStrings";
import { defaultFor } from "@/lib/admin/schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("newRecord") };
}

async function NewRecord({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/content/[key]/new">["params"];
}) {
  const { key } = await params;
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "collection") notFound();
  await requireStaff();
  const [t, strings] = await Promise.all([getTranslations("Admin.content"), getEditorStrings()]);
  const schema = editorSchema(key);
  const initial = defaultFor(schema, schema);
  // New records are real content, not Sample data.
  if (initial && typeof initial === "object" && "sample" in (schema.properties ?? {})) {
    (initial as Record<string, unknown>).sample = false;
  }

  return (
    <>
      <AdminPageHeader
        back={{ href: `/secure-admin-control/content/${key}`, label: t(`keys.${key}`) }}
        title={t("newRecord")}
      />
      <AdminPanel>
        <SchemaEditor
          schema={schema}
          initial={initial}
          onSave={createRecord.bind(null, key)}
          recordBase={`/secure-admin-control/content/${key}/`}
          strings={strings}
        />
      </AdminPanel>
    </>
  );
}

/** A new record in a content list, starting from the simplest valid shape (D138). */
export default function NewContentRecordPage(
  props: PageProps<"/[locale]/secure-admin-control/content/[key]/new">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-[720px] rounded-2xl" />}>
      <NewRecord params={props.params} />
    </Suspense>
  );
}
