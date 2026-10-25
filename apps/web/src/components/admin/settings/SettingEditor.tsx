import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ContentKey } from "@waafa/shared";
import { ContentEditor } from "@/components/admin/editor/ContentEditor";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { EDITOR_MESSAGES } from "@/lib/admin/blueprints/editorMessages";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import type { ContentSingleton } from "@/lib/admin/types";
import { SITE_URL } from "@/lib/siteUrl";

type SettingEditorProps = {
  contentKey: ContentKey;
  /** Only these parts of the document (Office hours of the contact details); saving keeps the rest as it is. */
  sections?: readonly string[];
};

/** One settings document inside the settings frame, with its own save bar (ADMIN.md §5.6). */
async function SettingEditor({ contentKey, sections }: SettingEditorProps) {
  const [staff, data, messages, { schema, blueprint }] = await Promise.all([
    requireStaff(),
    adminGet<ContentSingleton>(`/admin/content/${contentKey}`),
    getMessages(),
    resolveBlueprint(contentKey),
  ]);
  const shown = sections
    ? blueprint.sections.filter((section) => sections.includes(section.id))
    : blueprint.sections;

  return (
    <NextIntlClientProvider messages={pickMessagePaths(messages, EDITOR_MESSAGES)}>
      <ContentEditor
        mode="setting"
        contentKey={contentKey}
        blueprint={{ ...blueprint, sections: shown, layout: "embedded" }}
        schema={schema}
        initial={data.value}
        version={data.version}
        updatedAt={data.updatedAt}
        updatedBy={data.updatedBy}
        canAdvanced={staff.roles.includes("super-admin") && !sections}
        origin={SITE_URL}
      />
    </NextIntlClientProvider>
  );
}

export { SettingEditor };
