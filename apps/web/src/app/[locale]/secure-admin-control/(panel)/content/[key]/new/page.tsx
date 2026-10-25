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

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/secure-admin-control/content/[key]/new">): Promise<Metadata> {
  const [{ key }, t, tAdmin] = await Promise.all([
    params,
    getTranslations("Admin.content"),
    getTranslations("Admin"),
  ]);
  // "New tour package" in the browser tab, like the page heading (D0 R8).
  const one = `blueprints.${key}.one` as "blueprints.tourPackages.one";
  return {
    title:
      isContentKey(key) && tAdmin.has(one)
        ? t("newRecordOf", { thing: tAdmin(one) })
        : t("newRecord"),
  };
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
  // Lists keyed by a slug also give each record an inner id; a new one must be free in both.
  const takenIds = [
    ...new Set(
      list.items.flatMap((item) => {
        const inner = (item.data as { id?: unknown } | null)?.id;
        return typeof inner === "string" ? [item.id, inner] : [item.id];
      }),
    ),
  ];
  const initial = defaultFor(schema, schema);
  // New records are real content, not Sample data, and start the way the blueprint says (D0 R8).
  if (initial && typeof initial === "object") {
    if ("sample" in (schema.properties ?? {})) (initial as Record<string, unknown>).sample = false;
    Object.assign(initial, blueprint.startWith ?? {});
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
          takenIds={takenIds}
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
