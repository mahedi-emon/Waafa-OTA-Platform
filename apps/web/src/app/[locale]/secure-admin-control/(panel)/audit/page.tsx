import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AUDIT_AREAS, type AuditArea, type ContentKey } from "@waafa/shared";
import { AdminEmpty } from "@/components/admin/AdminEmpty";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListFilters } from "@/components/admin/ListFilters";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { auditTarget, verbPath, type AuditTarget } from "@/lib/admin/auditText";
import { changesBetween } from "@/lib/admin/blueprints/diff";
import { changeSentence, type HistoryWords } from "@/lib/admin/blueprints/historyText";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { dhakaDay, formatDhakaTime, formatPlainDate, pageParam } from "@/lib/admin/format";
import type { AuditRow, Paged, StaffDirectoryEntry } from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.audit");
  return { title: t("metaTitle") };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SHOWN = 6;

async function Audit({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/secure-admin-control/audit">["searchParams"];
}) {
  const params = await searchParams;
  const page = pageParam(params.page);
  const areaParam = one(params.area);
  const area = areaParam && areaParam in AUDIT_AREAS ? (areaParam as AuditArea) : undefined;
  const actorParam = one(params.actorId);
  const actorId = actorParam && /^[a-z0-9]{8,40}$/.test(actorParam) ? actorParam : undefined;
  const from = DAY.test(one(params.from) ?? "") ? one(params.from) : undefined;
  const to = DAY.test(one(params.to) ?? "") ? one(params.to) : undefined;
  const query = { area, actorId, from, to };

  const [list, people, t, tc, th, tk] = await Promise.all([
    adminGet<Paged<AuditRow>>("/admin/audit", { ...query, page, pageSize: 40 }),
    adminGet<StaffDirectoryEntry[]>("/admin/staff").catch(() => [] as StaffDirectoryEntry[]),
    getTranslations("Admin.audit"),
    getTranslations("Admin.common"),
    getTranslations("Admin.editor.history"),
    getTranslations("Admin.content"),
  ]);

  // Blueprints of the content on this page, for record nouns and History-style change lines.
  const targets = list.items.map((row) => ({ row, target: auditTarget(row) }));
  const keys = [
    ...new Set(targets.flatMap(({ target }) => ("key" in target ? [target.key] : []))),
  ] as ContentKey[];
  const blueprints = new Map<ContentKey, ResolvedBlueprint>(
    await Promise.all(
      keys.map(async (key) => [key, (await resolveBlueprint(key)).blueprint] as const),
    ),
  );
  const words: HistoryWords = {
    change: (field, before, after) => th("change", { field, from: before, to: after }),
    set: (field, after) => th("set", { field, to: after }),
    cleared: (field) => th("cleared", { field }),
    edited: (field) => th("edited", { field }),
    list: (field, before, after) => th("listChanged", { field, from: before, to: after }),
    on: th("on"),
    off: th("off"),
  };
  const targetWords = (target: AuditTarget): string => {
    switch (target.kind) {
      case "record": {
        const thing = blueprints.get(target.key)?.nouns.one ?? tk(`keys.${target.key}`);
        return target.name
          ? t("targets.record", { thing, name: target.name })
          : t("targets.recordUnnamed", { thing });
      }
      case "setting":
        return t("targets.setting", { setting: tk(`keys.${target.key}`) });
      case "list":
        return t("targets.list", { list: tk(`keys.${target.key}`) });
      case "update":
        return t("targets.update", { count: target.changed });
      case "other":
        return t("targets.other");
      default:
        return target.name
          ? t(`targets.${target.kind}`, { name: target.name })
          : t(`targets.${target.kind}Unnamed`);
    }
  };
  const known = (path: string) => t.has(`verbs.${path}` as "verbs.other");

  const rows = targets.map(({ row, target }) => {
    const blueprint = "key" in target ? blueprints.get(target.key) : undefined;
    const creates = row.action === "content.create" || row.action === "content.duplicate";
    const changes =
      blueprint && (target.kind === "record" || target.kind === "setting") && !creates
        ? changesBetween(row.before, row.after, blueprint)
        : [];
    return {
      id: row.id,
      at: row.at,
      day: dhakaDay(row.at),
      sentence: t(`verbs.${verbPath(row.action, known)}` as "verbs.other", {
        actor: row.actor,
        target: targetWords(target),
      }),
      reason: row.reason,
      changes: changes.slice(0, SHOWN).map((change) => changeSentence(blueprint!, change, words)),
      more: Math.max(0, changes.length - SHOWN),
    };
  });
  const days = [...new Set(rows.map((row) => row.day))];
  const filtered = Object.values(query).some(Boolean);

  return (
    <SettingsFrame current="audit">
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="mb-5">
        <ListFilters
          query={{ area, actorId, from, to }}
          selects={[
            {
              name: "actorId",
              label: t("filters.person"),
              value: actorId ?? "",
              options: [
                { value: "", label: t("filters.anyone") },
                ...people.map((person) => ({ value: person.id, label: person.name })),
              ],
            },
            {
              name: "area",
              label: t("filters.area"),
              value: area ?? "",
              options: [
                { value: "", label: t("filters.everywhere") },
                ...(Object.keys(AUDIT_AREAS) as AuditArea[]).map((value) => ({
                  value,
                  label: t(`areas.${value}`),
                })),
              ],
            },
          ]}
          dates={[
            { name: "from", label: t("filters.from"), value: from ?? "" },
            { name: "to", label: t("filters.to"), value: to ?? "" },
          ]}
          strings={{ apply: t("filters.apply"), reset: t("filters.clear") }}
        />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-mist-200 bg-white">
          <AdminEmpty title={filtered ? t("empty") : t("emptyAll")} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
          {days.map((day) => (
            <section key={day} aria-labelledby={`audit-${day}`}>
              <h2
                id={`audit-${day}`}
                className="border-b border-mist-100 bg-mist-25 px-5 py-2 text-[13px] font-semibold text-mist-700"
              >
                {formatPlainDate(day)}
              </h2>
              <ul className="divide-y divide-mist-100">
                {rows
                  .filter((row) => row.day === day)
                  .map((row) => (
                    <li key={row.id} className="flex gap-4 px-5 py-3">
                      <time
                        dateTime={row.at}
                        className="w-16 shrink-0 pt-0.5 text-[13px] text-mist-500 tabular-nums"
                      >
                        {formatDhakaTime(row.at)}
                      </time>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] text-navy-900">{row.sentence}</p>
                        {row.reason ? (
                          <p className="mt-0.5 text-[13.5px] text-mist-600">{row.reason}</p>
                        ) : null}
                        {row.changes.length > 0 ? (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-[13.5px] font-semibold text-brand-700">
                              {t("showChange")}
                            </summary>
                            <ul className="mt-2 flex flex-col gap-1 border-l-2 border-mist-200 pl-3 text-[13.5px] text-mist-800">
                              {row.changes.map((sentence, index) => (
                                <li key={index}>{sentence}</li>
                              ))}
                              {row.more > 0 ? (
                                <li className="text-mist-600">
                                  {t("moreChanges", { count: row.more })}
                                </li>
                              ) : null}
                            </ul>
                          </details>
                        ) : null}
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <AdminPagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            path="/secure-admin-control/audit"
            query={query}
            strings={{
              previous: tc("previous"),
              next: tc("next"),
              summary: tc("showing", { shown: list.items.length, total: list.total }),
            }}
          />
        </div>
      )}
    </SettingsFrame>
  );
}

/** Audit log (ADMIN.md §5.6): every admin change as a sentence, by person, area and day. */
export default function AuditPage(props: PageProps<"/[locale]/secure-admin-control/audit">) {
  return (
    <Suspense fallback={<Skeleton className="h-140 rounded-2xl" />}>
      <Audit searchParams={props.searchParams} />
    </Suspense>
  );
}
