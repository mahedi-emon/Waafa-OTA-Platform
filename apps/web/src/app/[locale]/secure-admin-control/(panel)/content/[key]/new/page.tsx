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
import { EDITOR_MESSAGES } from "@/lib/admin/blueprints/editorMessages";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import { defaultFor } from "@/lib/admin/schema";
import type { ContentCollection } from "@/lib/admin/types";
import { SITE_URL } from "@/lib/siteUrl";

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
  const [staff, list, t, te, messages, { schema, blueprint }] = await Promise.all([
    requireStaff(),
    adminGet<ContentCollection>(`/admin/content/${key}`),
    getTranslations("Admin.content"),
    getTranslations("Admin.editor.new"),
    getMessages(),
    resolveBlueprint(key),
  ]);
  const initial = defaultFor(schema, schema);
  // New records are real content, not Sample data.
  if (initial && typeof initial === "object" && "sample" in (schema.properties ?? {})) {
    (initial as Record<string, unknown>).sample = false;
  }

  return (
    <>
      <AdminPageHeader
        back={{ href: `/secure-admin-control/content/${key}`, label: t(`keys.${key}`) }}
        title={te("title", { thing: blueprint.nouns.one })}
        lead={te(
          blueprint.workflow
            ? "lead"
            : blueprint.visibility.length > 0
              ? "leadVisibility"
              : "leadLive",
        )}
      />
      <NextIntlClientProvider messages={pickMessagePaths(messages, EDITOR_MESSAGES)}>
        <ContentEditor
          mode="new"
          contentKey={key}
          blueprint={blueprint}
          schema={schema}
          initial={initial}
          takenIds={list.items.map((item) => item.id)}
          canAdvanced={staff.roles.includes("super-admin")}
          origin={SITE_URL}
        />
      </NextIntlClientProvider>
    </>
  );
}

/** A new record of a content list, starting from the simplest valid shape (form engine v2, D0 R2). */
export default function NewContentRecordPage(
  props: PageProps<"/[locale]/secure-admin-control/content/[key]/new">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-180 rounded-2xl" />}>
      <NewRecord params={props.params} />
    </Suspense>
  );
}
