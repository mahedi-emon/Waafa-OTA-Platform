"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { useTranslations } from "next-intl";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMinWidth } from "@/hooks/use-min-width";
import { pathFromDotted } from "@/lib/admin/blueprints/paths";
import { getAt } from "@/lib/admin/schema";
import { SchemaEditorContext, type SchemaEditorContextValue } from "../schema/useSchemaEditor";
import { ConflictDialog } from "./ConflictDialog";
import { DraftBanner } from "./DraftBanner";
import { EditorActionBar } from "./EditorActionBar";
import { EditorAdvanced } from "./EditorAdvanced";
import { EditorHistory } from "./EditorHistory";
import { EditorNoticeBanner } from "./EditorNoticeBanner";
import { EditorSection } from "./EditorSection";
import { EditorSectionJump } from "./EditorSectionJump";
import { EditorSectionRail, type SectionState } from "./EditorSectionRail";
import { EditorSidePanel } from "./EditorSidePanel";
import { LeaveDialog } from "./LeaveDialog";
import { ScheduleDialog } from "./ScheduleDialog";
import { missingForPublish, useEditorState, type EditorInput } from "./useEditorState";

type ContentEditorProps = EditorInput & {
  /** The Super Admin also sees Advanced (fields outside the blueprint, the record as JSON). */
  canAdvanced: boolean;
  /** The public site's address, for full links and the Google preview. */
  origin: string;
};

/** The time a scheduled record goes live, if it is scheduled. */
const scheduledAt = (value: unknown): string | undefined => {
  const record = value as { status?: unknown; publishAt?: unknown } | null;
  return record?.status === "scheduled" && typeof record.publishAt === "string"
    ? record.publishAt
    : undefined;
};

/** Empty for a section tick: nothing typed, an empty list, or a group with nothing in it (a photo without a file). */
const isEmpty = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("src" in record) return isEmpty(record.src);
    return Object.values(record).every(isEmpty);
  }
  return false;
};

/**
 * The sectioned record and settings editor (form engine v2, ADMIN.md §5.4): section list, one column of sections,
 * the side panel, the sticky action bar, History, the draft kept on this device, edit conflicts and the unsaved
 * guard. Built on the generic SchemaEditor widgets and the key's resolved blueprint.
 */
function ContentEditor({ canAdvanced, origin, ...input }: ContentEditorProps) {
  const t = useTranslations("Admin.editor");
  const state = useEditorState(input);
  const { blueprint, schema } = input;
  // One section needs no section list: such an editor (a template, a group fare) takes the centred column too.
  const single = blueprint.sections.length <= 1;
  const writing = blueprint.layout === "writing" || (single && blueprint.layout !== "embedded");
  const embedded = blueprint.layout === "embedded";
  const [tab, setTab] = useState("edit");
  const [sideOpen, setSideOpen] = useState(false);
  // From 1280 px the side panel is a column of its own and always open (folded above the form when embedded).
  const wide = useMinWidth(1280) && !embedded;

  const context = useMemo<SchemaEditorContextValue>(
    () => ({
      root: schema,
      blueprint,
      value: state.value,
      errors: state.errors,
      change: state.change,
      update: state.update,
      touch: state.touch,
      isNew: state.isNew,
      live: state.live,
      origin,
      slugFollows: state.slugFollows,
    }),
    [
      schema,
      blueprint,
      state.value,
      state.errors,
      state.change,
      state.update,
      state.touch,
      state.isNew,
      state.live,
      origin,
      state.slugFollows,
    ],
  );

  // Section ticks: complete when its required fields are filled, attention when one of its fields has a problem.
  const sectionStates = useMemo(() => {
    const required = new Set(schema.required ?? []);
    const states: Record<string, SectionState> = {};
    const errorTops = new Set(
      [...state.errors.keys()].map((dotted) => String(pathFromDotted(dotted)[0] ?? "")),
    );
    for (const section of blueprint.sections) {
      const fields = section.fields.filter((name) => !blueprint.fields[name]?.hidden);
      if (fields.some((name) => errorTops.has(name) || (name === "" && errorTops.size > 0))) {
        states[section.id] = "attention";
        continue;
      }
      const needed = fields.filter((name) => name === "" || required.has(name));
      const filled = (name: string) =>
        !isEmpty(name === "" ? state.value : getAt(state.value, [name]));
      // Sections without required fields are complete once something is filled in.
      const done = needed.length > 0 ? needed.every(filled) : fields.some(filled);
      states[section.id] = done ? "complete" : "open";
    }
    return states;
  }, [schema, blueprint, state.errors, state.value]);

  const missing = blueprint.workflow ? missingForPublish(blueprint, state.value) : [];
  const side = (
    <EditorSidePanel
      state={state}
      blueprint={blueprint}
      mode={input.mode}
      onHistory={() => {
        setTab("history");
        window.scrollTo({ top: 0 });
      }}
    />
  );

  const form = (
    <div className="flex min-w-0 flex-col gap-5">
      {state.draft ? (
        <DraftBanner
          draft={state.draft}
          older={state.draftIsOlder}
          onRestore={state.restoreDraft}
          onDiscard={state.dropDraft}
        />
      ) : null}
      {state.notice ? (
        <EditorNoticeBanner
          notice={state.notice}
          errors={state.errors}
          blueprint={blueprint}
          missing={missing}
          onRetry={() => document.getElementById("editor-save")?.click()}
          onDismiss={state.dismissNotice}
        />
      ) : null}
      {embedded || single ? null : <EditorSectionJump sections={blueprint.sections} />}
      {blueprint.sections.map((section, index) => (
        <EditorSection key={section.id} section={section} next={blueprint.sections[index + 1]} />
      ))}
      {canAdvanced ? <EditorAdvanced fields={blueprint.advanced} /> : null}
    </div>
  );

  return (
    <SchemaEditorContext.Provider value={context}>
      {/* A writing view (a blog post) gives the text the room the section list would take (D0 R8). */}
      <div
        className={cn(
          "grid min-w-0 grid-cols-1 gap-6",
          embedded
            ? null
            : writing
              ? "xl:grid-cols-[minmax(0,1fr)_20rem]"
              : "lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_20rem]",
        )}
      >
        {writing || embedded ? null : (
          <aside className="hidden lg:row-span-2 lg:block">
            <EditorSectionRail sections={blueprint.sections} states={sectionStates} />
          </aside>
        )}
        {/* One side panel: folded above the form below 1280 px, always open at the side from 1280 px, where it
            scrolls on its own on short screens so its last buttons never sit under the action bar. */}
        <aside
          className={cn(
            "min-w-0",
            embedded
              ? null
              : writing
                ? "xl:col-start-2 xl:row-span-2 xl:row-start-1"
                : "lg:col-start-2 xl:col-start-3 xl:row-span-2 xl:row-start-1",
          )}
        >
          <Collapsible
            open={wide || sideOpen}
            onOpenChange={setSideOpen}
            className={
              embedded
                ? undefined
                : "xl:sticky xl:top-20 xl:max-h-[calc(100dvh-10.5rem)] xl:overflow-y-auto xl:overscroll-contain"
            }
          >
            <CollapsibleTrigger
              className={cn(
                "group flex min-h-12 w-full cursor-pointer items-center justify-between rounded-2xl border border-mist-200 bg-white px-4 text-[14.5px] font-semibold text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                embedded ? null : "xl:hidden",
              )}
            >
              {t("side.details")}
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-mist-500 transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("pt-3", embedded ? null : "xl:pt-0")}>
              {side}
            </CollapsibleContent>
          </Collapsible>
        </aside>
        <div
          className={cn(
            "min-w-0",
            embedded
              ? null
              : writing
                ? "mx-auto w-full max-w-3xl xl:col-start-1 xl:row-start-1"
                : "lg:col-start-2 xl:row-start-1",
          )}
        >
          {state.isNew ? (
            form
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="gap-5">
              <TabsList variant="line" className="w-full justify-start border-b border-mist-200">
                <TabsTrigger value="edit" className="min-w-11">
                  {t("tabs.edit")}
                </TabsTrigger>
                <TabsTrigger value="history" className="min-w-11">
                  {t("tabs.history")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit">{form}</TabsContent>
              <TabsContent value="history">
                {tab === "history" ? (
                  <EditorHistory
                    contentKey={input.contentKey}
                    recordId={input.mode === "setting" ? null : (input.recordId ?? null)}
                    blueprint={blueprint}
                    {...(state.saved.version ? { version: state.saved.version } : {})}
                    dirty={state.dirty}
                  />
                ) : null}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <EditorActionBar state={state} blueprint={blueprint} />
      <ConflictDialog
        open={state.conflict !== null}
        current={state.conflict?.current ?? null}
        onReload={() => state.resolveConflict("reload")}
        onKeep={() => state.resolveConflict("keep")}
      />
      <LeaveDialog open={state.leaveTo !== null} onStay={state.stay} onLeave={state.leave} />
      {blueprint.workflow && state.scheduling ? (
        <ScheduleDialog
          open
          onOpenChange={(open) => (open ? null : state.closeSchedule())}
          current={scheduledAt(state.saved.value)}
          pending={state.pending}
          onSchedule={(at) => {
            state.closeSchedule();
            state.save("schedule", { at });
          }}
        />
      ) : null}
    </SchemaEditorContext.Provider>
  );
}

export { ContentEditor };
