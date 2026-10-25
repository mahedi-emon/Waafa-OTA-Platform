import { ChevronRight, EyeOff, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { canCopy, type ContentKey } from "@waafa/shared";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { adminGet } from "@/lib/admin/adminApi";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import type { ContentCollection } from "@/lib/admin/types";

type SettingsRecordListProps = { contentKey: ContentKey };

const ADMIN = "/secure-admin-control";

/** A field's label for a stored value (a template's name, a channel), or the value itself. */
const labelOf = (choices: Array<{ value: string; label: string }> | undefined, value: unknown) =>
  typeof value === "string"
    ? (choices?.find((choice) => choice.value === value)?.label ?? value)
    : "";

/**
 * A short list inside a settings section (message templates, EMI banks): each row in words, opening its editor; Off
 * when it is switched off. Add appears only where a new record can be valid.
 */
async function SettingsRecordList({ contentKey }: SettingsRecordListProps) {
  const [list, { blueprint }, t] = await Promise.all([
    adminGet<ContentCollection>(`/admin/content/${contentKey}`),
    resolveBlueprint(contentKey),
    getTranslations("Admin.settingsIndex"),
  ]);
  const titleChoices = blueprint.fields[list.titleField]?.choices;
  const channel = blueprint.fields.channel?.choices;

  return (
    <section className="flex flex-col gap-4">
      {canCopy(contentKey) ? (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link href={`${ADMIN}/content/${contentKey}/new`} prefetch={false}>
              <Plus aria-hidden="true" />
              {t("add", { thing: blueprint.nouns.one })}
            </Link>
          </Button>
        </div>
      ) : null}
      {list.items.length === 0 ? (
        <div className="rounded-2xl border border-mist-200 bg-white">
          <AdminEmpty title={t("emptyTitle", { things: blueprint.nouns.other })} />
        </div>
      ) : (
        <ul className="divide-y divide-mist-100 overflow-hidden rounded-2xl border border-mist-200 bg-white">
          {list.items.map((item) => {
            const data = (item.data ?? {}) as Record<string, unknown>;
            const off = data.enabled === false || data.visible === false;
            const line = [
              labelOf(channel, data.channel),
              typeof data.audience === "string" ? data.audience : "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li key={item.id}>
                <Link
                  href={`${ADMIN}/content/${contentKey}/${encodeURIComponent(item.id)}`}
                  prefetch={false}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-mist-25 focus-visible:bg-electric-50 focus-visible:outline-none motion-reduce:transition-none"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-navy-900">
                      {labelOf(titleChoices, item.title) || item.title}
                    </span>
                    {line ? <span className="text-[13.5px] text-mist-600">{line}</span> : null}
                  </span>
                  {off ? (
                    <span className="relative inline-flex shrink-0 items-center gap-1 rounded-full bg-mist-100 px-2.5 py-0.5 text-[12.5px] font-semibold text-mist-700">
                      <EyeOff aria-hidden="true" className="size-3.5" />
                      {t("off")}
                    </span>
                  ) : null}
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-mist-400" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export { SettingsRecordList };
