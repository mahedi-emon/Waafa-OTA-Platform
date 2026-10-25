import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AUDIT_AREAS, type AuditArea, type ContentKey } from "@waafa/shared";
import { AdminDateRange } from "@/components/admin/AdminDateRange";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SettingsFrame } from "@/components/admin/settings/SettingsFrame";
import { AdminDataTable } from "@/components/admin/table/AdminDataTable";
import { pageSizeOf } from "@/components/admin/table/listQuery";
import type { ColumnSpec, DataRow } from "@/components/admin/table/types";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGet } from "@/lib/admin/adminApi";
import { auditTarget, verbPath, type AuditTarget } from "@/lib/admin/auditText";
import { changesBetween } from "@/lib/admin/blueprints/diff";
import { changeSentence, type HistoryWords } from "@/lib/admin/blueprints/historyText";
import { resolveBlueprint } from "@/lib/admin/blueprints/resolve";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { dateRangeStrings } from "@/lib/admin/dateRangeStrings";
import { dhakaToday } from "@/lib/admin/dateRanges";
import { formatDhakaDateTime, pageParam } from "@/lib/admin/format";
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
  const q = one(params.q)?.slice(0, 80);
  const areaParam = one(params.area);
  const area = areaParam && areaParam in AUDIT_AREAS ? (areaParam as AuditArea) : undefined;
  const actorParam = one(params.actorId);
  const actorId = actorParam && /^[a-z0-9]{8,40}$/.test(actorParam) ? actorParam : undefined;
  const from = DAY.test(one(params.from) ?? "") ? one(params.from) : undefined;
  const to = DAY.test(one(params.to) ?? "") ? one(params.to) : undefined;
  const query = { area, actorId, from, to, ...(q ? { q } : {}) };

  const [list, people, t, tc, th, tk, picker] = await Promise.all([
    adminGet<Paged<AuditRow>>("/admin/audit", {
      ...query,
      page: pageParam(params.page),
      pageSize: pageSizeOf(params.pageSize),
    }),
    adminGet<StaffDirectoryEntry[]>("/admin/staff").catch(() => [] as StaffDirectoryEntry[]),
    getTranslations("Admin.audit"),
    getTranslations("Admin.common"),
    getTranslations("Admin.editor.history"),
    getTranslations("Admin.content"),
    dateRangeStrings(),
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

  const rows: DataRow[] = targets.map(({ row, target }) => {
    const blueprint = "key" in target ? blueprints.get(target.key) : undefined;
    const creates = row.action === "content.create" || row.action === "content.duplicate";
    const changes =
      blueprint && (target.kind === "record" || target.kind === "setting") && !creates
        ? changesBetween(row.before, row.after, blueprint)
        : [];
    const lines = changes
      .slice(0, SHOWN)
      .map((change) => changeSentence(blueprint!, change, words));
    const more = Math.max(0, changes.length - SHOWN);
    const when = formatDhakaDateTime(row.at);
    const sentence = t(`verbs.${verbPath(row.action, known)}` as "verbs.other", {
      actor: row.actor,
      target: targetWords(target),
    });
    const area = (Object.keys(AUDIT_AREAS) as AuditArea[]).find((key) =>
      AUDIT_AREAS[key].some((prefix) => row.action.startsWith(prefix)),
    );
    return {
      id: row.id,
      title: sentence,
      subtitle: when,
      thumb: { initials: row.actor.slice(0, 2).toUpperCase() },
      chips: [],
      facts: {
        person: { text: row.actor },
        area: { text: area ? t(`areas.${area}`) : "", kind: "muted" },
        when: { text: when, kind: "date" },
      },
      summary: [
        { label: t("colPerson"), value: row.actor },
        { label: t("colWhen"), value: when },
        ...(row.reason ? [{ label: t("colReason"), value: row.reason }] : []),
      ],
      ...(lines.length > 0
        ? {
            actions: (
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] font-semibold text-mist-600">{t("whatChanged")}</p>
                <ul className="flex flex-col gap-1 border-l-2 border-mist-200 pl-3 text-[13.5px] text-mist-800">
                  {lines.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                  {more > 0 ? (
                    <li className="text-mist-600">{t("moreChanges", { count: more })}</li>
                  ) : null}
                </ul>
              </div>
            ),
          }
        : {}),
    };
  });
  const filtered = Object.values(query).some(Boolean);

  const columns: ColumnSpec[] = [
    { key: "name", label: t("colChange"), always: true },
    { key: "person", label: t("colPerson") },
    { key: "area", label: t("colArea") },
    { key: "when", label: t("colWhen") },
  ];

  return (
    <SettingsFrame current="audit">
      <AdminPageHeader title={t("title")} lead={t("lead")} />
      <div className="mb-4">
        <AdminDateRange from={from} to={to} today={dhakaToday()} strings={picker} />
      </div>
      <AdminDataTable
        listKey="audit"
        path="/secure-admin-control/audit"
        rows={rows}
        columns={columns}
        page={{ total: list.total, page: list.page, pageSize: list.pageSize }}
        searchLabel={t("search")}
        filters={[
          {
            param: "actorId",
            label: t("filters.person"),
            options: people.map((person) => ({ value: person.id, label: person.name })),
          },
          {
            param: "area",
            label: t("filters.area"),
            options: (Object.keys(AUDIT_AREAS) as AuditArea[]).map((value) => ({
              value,
              label: t(`areas.${value}`),
            })),
          },
        ]}
        openLabel={tc("open")}
        empty={{ title: filtered ? t("empty") : t("emptyAll"), body: t("emptyBody") }}
      />
    </SettingsFrame>
  );
}

/** Audit log (ADMIN.md §5.6): every admin change as a sentence on the shared DataTable (issue 229). */
export default function AuditPage(props: PageProps<"/[locale]/secure-admin-control/audit">) {
  return (
    <Suspense fallback={<Skeleton className="h-140 rounded-2xl" />}>
      <Audit searchParams={props.searchParams} />
    </Suspense>
  );
}
