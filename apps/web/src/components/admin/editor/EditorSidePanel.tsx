"use client";

import {
  CalendarX2,
  Archive,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleDashed,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  History,
  Pencil,
  Radio,
  Trash2,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/admin/StatusChip";
import { RelativeTime } from "@/components/admin/RelativeTime";
import { editorName, formatDhakaDateTime } from "@/lib/admin/format";
import { publicPathOf, statusOf } from "@/lib/admin/blueprints/display";
import { previewHref } from "@/lib/previewLinks";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import type { ChipTone } from "@/lib/admin/statusChips";
import { SchemaField } from "../schema/SchemaField";
import { useSchemaEditor } from "../schema/useSchemaEditor";
import { missingForPublish, type EditorMode, type EditorState } from "./useEditorState";

type EditorSidePanelProps = {
  state: EditorState;
  blueprint: ResolvedBlueprint;
  mode: EditorMode;
  onHistory: () => void;
};

const CHIP = {
  new: { tone: "info", icon: FilePlus2 },
  draft: { tone: "neutral", icon: Pencil },
  scheduled: { tone: "info", icon: Clock },
  live: { tone: "success", icon: Radio },
  archived: { tone: "neutral", icon: Archive },
  shown: { tone: "success", icon: Eye },
  hidden: { tone: "neutral", icon: EyeOff },
  direct: { tone: "success", icon: Radio },
  startsLater: { tone: "info", icon: Clock },
  ended: { tone: "neutral", icon: CalendarX2 },
} as const satisfies Record<string, { tone: ChipTone; icon: typeof Pencil }>;

/**
 * The editor's right rail (ADMIN.md §5.4): the status with its reason, visibility, what Publish still needs, the
 * Google snippet, who edited last, and History, Duplicate and Delete. Below 1280 px it sits above the form.
 */
function EditorSidePanel({ state, blueprint, mode, onHistory }: EditorSidePanelProps) {
  const t = useTranslations("Admin.editor");
  const editor = useSchemaEditor();
  const record = (state.value && typeof state.value === "object" ? state.value : {}) as Record<
    string,
    unknown
  >;
  const savedRecord = (
    state.saved.value && typeof state.saved.value === "object" ? state.saved.value : {}
  ) as Record<string, unknown>;
  const status = statusOf(blueprint, savedRecord, state.isNew);
  const where = publicPathOf(blueprint, savedRecord);
  const showView =
    where && (status.state === "live" || status.state === "shown" || status.state === "direct");
  // Not live yet: Preview of unpublished changes opens the saved version as it will look (D0 R7).
  const showPreview =
    where && !state.isNew && (status.state === "draft" || status.state === "scheduled");
  const missing = blueprint.workflow ? missingForPublish(blueprint, record) : [];
  const required = new Set(editor.root.required ?? []);
  // Seeded records were "edited by" the setup, which isn't a person; other system saves get words (D0 R10).
  const editedBy =
    state.saved.updatedBy === "seed"
      ? null
      : editorName(state.saved.updatedBy, {
          sample: t("actors.sample"),
          update: t("actors.update"),
          order: t("actors.order"),
        });
  // Scheduled and Live name their date (D0 R4): "Goes live on 24 Oct 2026, 10:00 am".
  const reason =
    status.at &&
    (status.state === "scheduled" ||
      status.state === "live" ||
      status.state === "startsLater" ||
      status.state === "ended")
      ? t(`status.${status.state}ReasonAt`, { date: formatDhakaDateTime(status.at) })
      : t(`status.${status.state}Reason`);

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="side-status"
        className="rounded-2xl border border-mist-200 bg-white p-4"
      >
        <h2 id="side-status" className="mb-3 text-[13.5px] font-semibold text-mist-600">
          {t("side.status")}
        </h2>
        <div className="flex flex-col gap-2">
          <StatusChip
            tone={CHIP[status.state].tone}
            icon={CHIP[status.state].icon}
            label={t(`status.${status.state}`)}
            reason={reason}
            focusable
          />
          <p className="text-[13.5px] text-mist-600">{reason}</p>
        </div>
        {showView ? (
          <a
            href={where}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-[14px] font-semibold text-brand-700 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {t("side.viewOnSite")}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        ) : null}
        {showPreview ? (
          <div className="mt-3 flex flex-col gap-1">
            <a
              href={previewHref(where)}
              target="_blank"
              rel="noopener"
              aria-describedby="side-preview-help"
              className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg text-[14px] font-semibold text-brand-700 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              {t("side.preview")}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
            <p id="side-preview-help" className="text-[13px] text-mist-600">
              {t("side.previewHelp")}
            </p>
          </div>
        ) : null}
        {/* A new record's chip already says it isn't saved. */}
        {!state.isNew ? (
          <p className="mt-3 border-t border-mist-100 pt-3 text-[13px] text-mist-600">
            {state.saved.updatedAt
              ? editedBy
                ? t.rich("side.edited", {
                    when: () => <RelativeTime iso={state.saved.updatedAt ?? ""} />,
                    name: editedBy,
                  })
                : t.rich("side.editedNoName", {
                    when: () => <RelativeTime iso={state.saved.updatedAt ?? ""} />,
                  })
              : t("side.notSaved")}
          </p>
        ) : null}
        {record.sample === true ? (
          <p className="mt-3 rounded-xl bg-warning-50 p-3 text-[13.5px] text-warning-800">
            <span className="font-semibold">{t("side.sample")}.</span> {t("side.sampleNote")}
          </p>
        ) : null}
      </section>

      {blueprint.visibility.length > 0 ? (
        <section
          aria-labelledby="side-visibility"
          className="rounded-2xl border border-mist-200 bg-white p-4"
        >
          <h2 id="side-visibility" className="mb-3 text-[13.5px] font-semibold text-mist-600">
            {t("side.visibility")}
          </h2>
          <div className="flex flex-col gap-4">
            {blueprint.visibility.map((name) => (
              <SchemaField
                key={name}
                schema={editor.root.properties?.[name] ?? {}}
                path={[name]}
                value={record[name]}
                optional={!required.has(name)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {blueprint.workflow ? (
        <section
          aria-labelledby="side-checklist"
          className="rounded-2xl border border-mist-200 bg-white p-4"
        >
          <h2 id="side-checklist" className="mb-3 text-[13.5px] font-semibold text-mist-600">
            {t("side.publishing")}
          </h2>
          {status.state === "new" || status.state === "draft" ? (
            <>
              <p className="mb-2 text-[13.5px] font-semibold text-navy-900">
                {t("side.checklist")}
              </p>
              {missing.length === 0 ? (
                <p className="flex items-center gap-2 text-[14px] font-medium text-success-700">
                  <CircleCheck aria-hidden="true" className="size-4" />
                  {t("side.checklistReady")}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {missing.map((label) => (
                    <li key={label} className="flex items-start gap-2 text-[14px] text-ink-900">
                      <CircleDashed
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-warning-800"
                      />
                      {t("side.missing", { field: label })}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
          {status.state === "scheduled" ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={state.pending}
                onClick={state.openSchedule}
              >
                <CalendarClock aria-hidden="true" className="size-4" />
                {t("side.changeTime")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={state.pending}
                onClick={() => state.save("unpublish")}
              >
                <CalendarX aria-hidden="true" className="size-4" />
                {t("side.cancelSchedule")}
              </Button>
            </div>
          ) : null}
          {!state.isNew && status.state !== "draft" && status.state !== "scheduled" ? (
            <div className="flex flex-col gap-2">
              {status.state === "live" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={state.pending}
                  onClick={() => state.save("unpublish")}
                >
                  <Undo2 aria-hidden="true" className="size-4" />
                  {t("side.unpublish")}
                </Button>
              ) : null}
              {status.state === "archived" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={state.pending}
                  onClick={() => state.save("restore")}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  {t("side.toDraft")}
                </Button>
              ) : null}
            </div>
          ) : null}
          {!state.isNew && status.state !== "archived" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={state.pending}
              onClick={() => state.save("archive")}
              className="mt-2 w-full justify-start text-mist-700"
            >
              <Archive aria-hidden="true" className="size-4" />
              {t("side.archive")}
            </Button>
          ) : null}
        </section>
      ) : null}

      {!state.isNew ? (
        <section
          aria-labelledby="side-actions"
          // The gap keeps each button's touch area (it reaches 3 px past the button) off its neighbour.
          className="flex flex-col gap-1.5 rounded-2xl border border-mist-200 bg-white p-2"
        >
          <h2 id="side-actions" className="sr-only">
            {t("side.actions")}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onHistory}
            className="w-full justify-start"
          >
            <History aria-hidden="true" className="size-4" />
            {t("side.history")}
          </Button>
          {mode === "record" ? (
            <>
              {blueprint.duplicable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={state.pending}
                  onClick={state.duplicate}
                  className="w-full justify-start"
                >
                  <Copy aria-hidden="true" className="size-4" />
                  {t("side.duplicate")}
                </Button>
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={state.pending}
                    className="w-full justify-start text-danger-700"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    {t("side.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("side.deleteTitle", { thing: blueprint.nouns.one })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{t("side.deleteBody")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("side.cancel")}</AlertDialogCancel>
                    <AlertDialogAction variant="danger" onClick={state.remove}>
                      {t("side.deleteConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export { EditorSidePanel };
