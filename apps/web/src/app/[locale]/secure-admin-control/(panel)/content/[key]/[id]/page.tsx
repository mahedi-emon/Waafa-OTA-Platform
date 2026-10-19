import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CONTENT_MODEL, isContentKey } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContentEditor } from "@/components/admin/editor/ContentEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { headingOf } from "@/lib/admin/blueprints/display";
import { EDITOR_MESSAGES } from "@/lib/admin/blueprints/editorMessages";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import type { ContentRecordResponse } from "@/lib/admin/types";
import { SITE_URL } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.content");
  return { title: t("metaTitle") };
}

async function RecordView({
  params,
}: {
  params: PageProps<"/[locale]/secure-admin-control/content/[key]/[id]">["params"];
}) {
  const { key, id } = await params;
  if (!isContentKey(key) || CONTENT_MODEL[key].kind !== "collection") notFound();
  const recordId = decodeURIComponent(id);
  const [record, staff, t, messages, { schema, blueprint }] = await Promise.all([
    adminGet<ContentRecordResponse>(`/admin/content/${key}/${encodeURIComponent(recordId)}`),
    requireStaff(),
    getTranslations("Admin.content"),
    getMessages(),
    resolveBlueprint(key),
  ]);

  return (
    <>
      <AdminPageHeader
        back={{ href: `/secure-admin-control/content/${key}`, label: t(`keys.${key}`) }}
        title={headingOf(blueprint, record.data) || recordId}
        lead={blueprint.intro}
      />
      <NextIntlClientProvider messages={pickMessagePaths(messages, EDITOR_MESSAGES)}>
        <ContentEditor
          key={record.version}
          mode="record"
          contentKey={key}
          recordId={record.id}
          blueprint={blueprint}
          schema={schema}
          initial={record.data}
          version={record.version}
          updatedAt={record.updatedAt}
          updatedBy={record.updatedBy ?? null}
          canAdvanced={staff.roles.includes("super-admin")}
          origin={SITE_URL}
        />
      </NextIntlClientProvider>
    </>
  );
}

/** Edit one record of a content list with its blueprint (form engine v2, D0 R2). */
export default function ContentRecordPage(
  props: PageProps<"/[locale]/secure-admin-control/content/[key]/[id]">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-180 rounded-2xl" />}>
      <RecordView params={props.params} />
    </Suspense>
  );
}
