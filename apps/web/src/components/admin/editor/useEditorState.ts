"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { applyAutomatic } from "@/lib/admin/blueprints/automatic";
import { dottedOf, pathsMatching } from "@/lib/admin/blueprints/paths";
import type { ContentActionInput } from "@waafa/shared";
import {
  viewOfProblem,
  type CurrentVersion,
  type ProblemCode,
} from "@/lib/admin/blueprints/problems";
import { slugify } from "@/lib/admin/blueprints/slug";
import type { ResolvedBlueprint } from "@/lib/admin/blueprints/types";
import { validateRecord, type FieldError } from "@/lib/admin/blueprints/validate";
import type { AdminProblem } from "@/lib/admin/adminApi";
import {
  createRecord,
  deleteRecord,
  duplicateRecord,
  restoreTrashItem,
  saveRecord,
  saveSetting,
  type SaveResult,
} from "@/lib/admin/contentActions";
import { formatDhakaDateTime } from "@/lib/admin/format";
import { getAt, setAt, type JsonSchema, type Path } from "@/lib/admin/schema";
import { setNavigationGuard } from "../navigationGuard";
import { markSignedOut } from "../sessionStore";
import { useContentOptions } from "../schema/useContentOptions";
import { clearDraft, draftKey, useDraftAtLoad, writeDraft, type Draft } from "./drafts";

export type EditorMode = "setting" | "record" | "new";
/** The editor's buttons (D0 R4): each one asks the API for a step; the API sets the status. */
export type SaveIntent =
  "save" | "draft" | "publish" | "schedule" | "unpublish" | "archive" | "restore";

export type EditorInput = {
  mode: EditorMode;
  contentKey: string;
  recordId?: string;
  blueprint: ResolvedBlueprint;
  schema: JsonSchema;
  initial: unknown;
  version?: number;
  updatedAt?: string;
  updatedBy?: string | null;
  /** Ids already used in the list, so a new record's id is free. */
  takenIds?: string[];
};

export type EditorNotice =
  { kind: "fields"; count: number } | { kind: "publish" } | { kind: "message"; code: ProblemCode };

/** The step a button asks for; Save keeps the stored status (a new record starts as a draft). */
function actionFor(intent: SaveIntent, isNew: boolean, at?: string): ContentActionInput {
  switch (intent) {
    case "save":
      return { type: isNew ? "saveDraft" : "update" };
    case "draft":
      return { type: "saveDraft" };
    case "publish":
      return { type: "publish" };
    case "schedule":
      return { type: "schedule", at: at ?? "" };
    case "unpublish":
      return { type: "unpublish" };
    case "archive":
      return { type: "archive" };
    case "restore":
      return { type: "restore" };
  }
}

const AUTOSAVE_AFTER = 1200;

/** Trims every text before a save, as the form shows it (ADMIN.md §6: "trims on save"). */
function trimmed(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(trimmed);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, trimmed(item)]),
    );
  return value;
}

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

/** Publish requirements that are still empty, by label (ADMIN.md §8.1). */
export function missingForPublish(blueprint: ResolvedBlueprint, value: unknown): string[] {
  return blueprint.publish
    .filter(({ path }) => {
      const paths = pathsMatching(value, path);
      return paths.length === 0 || paths.every((at) => isEmpty(getAt(value, at)));
    })
    .map(({ label }) => label);
}

/**
 * The editor's state (D0 R2): the record being edited, what's saved, problems in plain words, the draft kept on
 * this device, the unsaved-changes guard, Ctrl/Cmd+S, and every save, publish, duplicate and delete.
 */
export function useEditorState(input: EditorInput) {
  const { blueprint, schema, mode, contentKey, recordId } = input;
  const router = useRouter();
  const t = useTranslations("Admin.editor");
  const [value, setValue] = useState<unknown>(input.initial);
  /**
   * The newest value, also between renders: two changes in one event (a picker that fills a second field) and
   * callbacks that run later (Undo) build on it, never on the value of an older render.
   */
  const latest = useRef<unknown>(input.initial);
  const [saved, setSaved] = useState({
    value: input.initial,
    version: input.version,
    updatedAt: input.updatedAt,
    updatedBy: input.updatedBy ?? null,
  });
  const [errors, setErrors] = useState<ReadonlyMap<string, FieldError>>(() => new Map());
  const [notice, setNotice] = useState<EditorNotice | null>(null);
  const [conflict, setConflict] = useState<{
    current: CurrentVersion | null;
    intent: SaveIntent;
    at?: string;
  } | null>(null);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  /** The Schedule… dialog (D0 R4), opened from the action bar or the side panel. */
  const [scheduling, setScheduling] = useState(false);
  const [keptAt, setKeptAt] = useState<number | null>(null);
  const [draftHandled, setDraftHandled] = useState(false);
  const [pending, startTransition] = useTransition();
  // A newer version from the server (a restored version, the page refreshed after someone else saved) replaces what
  // is shown; the editor's own saves already match it, so tabs and open cards stay as they are.
  const [seenVersion, setSeenVersion] = useState(input.version);
  if (input.version !== seenVersion) {
    setSeenVersion(input.version);
    if (input.version !== saved.version) {
      setValue(input.initial);
      setSaved({
        value: input.initial,
        version: input.version,
        updatedAt: input.updatedAt,
        updatedBy: input.updatedBy ?? null,
      });
      setErrors(new Map());
      setNotice(null);
    }
  }
  /** Set right before the editor reloads the page itself, so the browser doesn't ask "Leave site?". */
  const unloading = useRef(false);

  const slugPatterns = useMemo(
    () =>
      Object.entries(blueprint.fields)
        .filter(([, field]) => field.widget === "slug")
        .map(([pattern]) => pattern),
    [blueprint],
  );
  const [following, setFollowing] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        slugPatterns.filter(
          (pattern) => mode === "new" || isEmpty(getAt(input.initial, [pattern])),
        ),
      ),
  );

  const isNew = mode === "new";
  const storage = draftKey(contentKey, recordId ?? (mode === "setting" ? "setting" : "new"));
  const instance = useId();
  const loadedDraft = useDraftAtLoad(storage, instance);
  const dirty = useMemo(
    () => JSON.stringify(value) !== JSON.stringify(saved.value),
    [value, saved.value],
  );
  useEffect(() => {
    latest.current = value;
  }, [value]);
  /** Shows a new value now and lets every later change build on it. */
  const show = useCallback((next: unknown) => {
    latest.current = next;
    setValue(next);
  }, []);
  const live =
    !isNew &&
    blueprint.workflow &&
    (saved.value as { status?: unknown } | null)?.status === "published";

  // Store categories need their parent's level (levelFromParent).
  const needsLevels = Object.values(blueprint.fields).some(
    (field) => field.auto === "levelFromParent",
  );
  const categories = useContentOptions(needsLevels ? "categories" : undefined);
  const levelOf = useCallback(
    (id: string) => {
      const option = categories.items.find((item) => item.values.id === id);
      const level = option ? Number(option.values.level) : Number.NaN;
      return Number.isFinite(level) ? level : undefined;
    },
    [categories.items],
  );

  /** Re-checks fields that already show a problem, so it clears as soon as it's fixed. */
  const recheck = useCallback(
    (next: unknown) => {
      if (errors.size === 0) return;
      const found = validateRecord(schema, next, blueprint);
      const kept = new Map<string, FieldError>();
      for (const [key] of errors) {
        const problem = found.get(key);
        if (problem) kept.set(key, problem);
      }
      setErrors(kept);
    },
    [errors, schema, blueprint],
  );

  const change = useCallback(
    (path: Path, next: unknown) => {
      let updated = setAt(latest.current, path, next);
      if (path.length === 1 && typeof path[0] === "string") {
        const name = path[0];
        if (slugPatterns.includes(name) && following.has(name)) {
          const rest = new Set(following);
          rest.delete(name);
          setFollowing(rest);
        }
        for (const pattern of slugPatterns) {
          const source = blueprint.fields[pattern]?.source ?? "title";
          if (source === name && following.has(pattern) && typeof next === "string")
            updated = setAt(updated, [pattern], slugify(next, 80));
        }
      }
      show(updated);
      recheck(updated);
      // Edited back to what is saved: a draft written in this visit has nothing left to keep. A draft found when
      // the page opened stays until staff restore or drop it.
      if ((!loadedDraft || draftHandled) && JSON.stringify(updated) === JSON.stringify(saved.value))
        clearDraft(storage);
    },
    [
      show,
      slugPatterns,
      following,
      blueprint,
      recheck,
      loadedDraft,
      draftHandled,
      saved.value,
      storage,
    ],
  );

  const update = useCallback(
    (path: Path, fn: (current: unknown) => unknown) =>
      change(path, fn(getAt(latest.current, path))),
    [change],
  );

  const touch = useCallback(
    (path: Path) => {
      const key = dottedOf(path);
      const problem = validateRecord(schema, latest.current, blueprint).get(key);
      setErrors((current) => {
        if (!problem && !current.has(key)) return current;
        const next = new Map(current);
        if (problem) next.set(key, problem);
        else next.delete(key);
        return next;
      });
    },
    [schema, blueprint],
  );

  // Keep the draft on this device a moment after each change. It is dropped only by a save, Discard, Drop, Delete
  // or editing back to the saved version, never because the form looks clean (Leave keeps it on purpose).
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      const draft: Draft = {
        value,
        savedAt: Date.now(),
        ...(saved.version ? { baseVersion: saved.version } : {}),
      };
      if (writeDraft(storage, draft)) setKeptAt(draft.savedAt);
    }, AUTOSAVE_AFTER);
    return () => window.clearTimeout(timer);
  }, [dirty, value, storage, saved.version]);

  // The unsaved-changes guard: closing the tab, links on the page, and Ctrl K / + New navigations.
  useEffect(() => {
    if (!dirty) {
      setNavigationGuard(null);
      return;
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!unloading.current) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveTo(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    setNavigationGuard((href) => {
      setLeaveTo(href);
      return true;
    });
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
      setNavigationGuard(null);
    };
  }, [dirty]);

  const report = (problem: AdminProblem, intent: SaveIntent, at?: string) => {
    const view = viewOfProblem(problem, validateRecord(schema, latest.current, blueprint));
    if (view.kind === "fields") {
      setErrors(view.errors);
      setNotice({ kind: "fields", count: view.errors.size });
    } else if (view.kind === "stale") {
      setConflict({ current: view.current ?? null, intent, ...(at ? { at } : {}) });
    } else if (view.kind === "signedOut") {
      markSignedOut();
    } else {
      setNotice({ kind: "message", code: view.code });
      toast.error(t(`errors.${view.code}`));
    }
  };

  /** Puts the Sample flag back after a first save made the record the team's own (the toast's Undo). */
  const keepSample = (version: number) =>
    startTransition(async () => {
      if (!recordId) return;
      const value = setAt(latest.current, ["sample"], true);
      const result = await saveRecord(contentKey, recordId, value, version, {
        action: { type: "update" },
        keepSample: true,
      });
      if (!result.ok) {
        toast.error(t("errors.server"));
        return;
      }
      const data = result.data ?? value;
      show(data);
      setSaved({
        value: data,
        version: result.version,
        updatedAt: result.updatedAt ?? new Date().toISOString(),
        updatedBy: result.updatedBy ?? null,
      });
      toast.success(t("toast.sampleKept"));
      router.refresh();
    });

  const save = (intent: SaveIntent, options: { version?: number; at?: string } = {}) => {
    const startedWith = latest.current;
    const prepared = applyAutomatic(trimmed(startedWith), blueprint, {
      isNew,
      now: new Date(),
      ...(input.takenIds ? { takenIds: input.takenIds } : {}),
      levelOf,
    });
    const found = validateRecord(schema, prepared, blueprint);
    if (found.size > 0) {
      setErrors(found);
      setNotice({ kind: "fields", count: found.size });
      return;
    }
    if (
      (intent === "publish" || intent === "schedule") &&
      missingForPublish(blueprint, prepared).length > 0
    ) {
      setNotice({ kind: "publish" });
      return;
    }
    const version = options.version ?? saved.version;
    // Lists with drafts send the button; the API sets the status from it (D0 R4, D216).
    const action = blueprint.workflow ? actionFor(intent, isNew, options.at) : undefined;
    startTransition(async () => {
      let result: SaveResult;
      try {
        result =
          mode === "setting"
            ? await saveSetting(contentKey, prepared, version)
            : mode === "new"
              ? await createRecord(contentKey, prepared, action ? { action } : {})
              : await saveRecord(
                  contentKey,
                  recordId ?? "",
                  prepared,
                  version,
                  action ? { action } : {},
                );
      } catch {
        result = {
          ok: false,
          problem: { status: navigator.onLine ? 500 : 0, title: "Unavailable" },
        };
      }
      if (!result.ok) {
        report(result.problem, intent, options.at);
        return;
      }
      // The record as the API saved it: the status and times its button set, the Sample flag it cleared.
      const stored = result.data ?? prepared;
      // Words typed while the save was on its way stay on screen, still unsaved (and kept on this device).
      if (JSON.stringify(latest.current) === JSON.stringify(startedWith)) {
        clearDraft(storage);
        show(stored);
      }
      setSaved({
        value: stored,
        version: result.version,
        updatedAt: result.updatedAt ?? new Date().toISOString(),
        updatedBy: result.updatedBy ?? null,
      });
      setErrors(new Map());
      setNotice(null);
      setFollowing(new Set());
      const words =
        intent === "publish"
          ? live
            ? t("toast.updated")
            : t("toast.published")
          : intent === "schedule"
            ? t("toast.scheduled", { when: formatDhakaDateTime(options.at ?? "") })
            : intent === "unpublish"
              ? t("toast.unpublished")
              : intent === "archive"
                ? t("toast.archived")
                : intent === "restore"
                  ? t("toast.restored")
                  : isNew
                    ? t("toast.created")
                    : t("toast.saved");
      const savedVersion = result.version;
      if (result.sampleCleared) {
        // The first staff save makes a Sample record the team's own; Undo marks it Sample again (ADMIN.md §9).
        toast.success(`${words} ${t("toast.sampleCleared")}`, {
          action: { label: t("toast.undo"), onClick: () => keepSample(savedVersion) },
        });
      } else {
        toast.success(words);
      }
      if (mode !== "setting" && result.id && (isNew || result.id !== recordId)) {
        router.replace(
          `/secure-admin-control/content/${contentKey}/${encodeURIComponent(result.id)}`,
        );
      } else {
        router.refresh();
      }
    });
  };

  const discard = () => {
    show(saved.value);
    setErrors(new Map());
    setNotice(null);
    clearDraft(storage);
  };

  const restoreDraft = () => {
    if (loadedDraft) show(loadedDraft.value);
    setDraftHandled(true);
  };
  const dropDraft = () => {
    clearDraft(storage);
    setDraftHandled(true);
  };

  const resolveConflict = (choice: "reload" | "keep") => {
    const open = conflict;
    setConflict(null);
    if (!open) return;
    if (choice === "reload") {
      // Keep this person's work on the device; the reloaded page offers it back.
      writeDraft(storage, {
        value: latest.current,
        savedAt: Date.now(),
        ...(open.current ? { baseVersion: open.current.version } : {}),
      });
      setNavigationGuard(null);
      unloading.current = true;
      window.location.reload();
      return;
    }
    save(open.intent, {
      ...(open.current ? { version: open.current.version } : {}),
      ...(open.at ? { at: open.at } : {}),
    });
  };

  const leave = () => {
    const target = leaveTo;
    setLeaveTo(null);
    if (!target) return;
    setNavigationGuard(null);
    // The draft stays on the device, so the work can be restored on return; the form only looks clean so
    // leaving doesn't ask again.
    const work = latest.current;
    writeDraft(storage, {
      value: work,
      savedAt: Date.now(),
      ...(saved.version ? { baseVersion: saved.version } : {}),
    });
    setSaved((current) => ({ ...current, value: work }));
    router.push(target);
  };

  const duplicate = () =>
    startTransition(async () => {
      if (!recordId) return;
      const result = await duplicateRecord(contentKey, recordId);
      if (!result.ok) {
        // A copy that can't be saved is not this record's problem: say so instead of marking its fields.
        if (viewOfProblem(result.problem).kind === "fields") toast.error(t("side.duplicateFailed"));
        else report(result.problem, "save");
        return;
      }
      const target = `/secure-admin-control/content/${contentKey}/${encodeURIComponent(result.id ?? "")}`;
      toast.success(t("side.duplicated"), {
        action: { label: t("toast.view"), onClick: () => router.push(target) },
      });
    });

  const remove = () =>
    startTransition(async () => {
      if (!recordId) return;
      const result = await deleteRecord(contentKey, recordId);
      if (!result.ok) {
        report(result.problem, "save");
        return;
      }
      clearDraft(storage);
      setNavigationGuard(null);
      setSaved((current) => ({ ...current, value: latest.current }));
      const trashId = result.trashId;
      // Delete moves the record to Trash (D0 R4): Undo brings it straight back.
      toast.success(t("side.deleted"), {
        ...(trashId
          ? {
              action: {
                label: t("toast.undo"),
                onClick: () => {
                  void restoreTrashItem(trashId).then((back) => {
                    if (!back.ok) {
                      toast.error(t("errors.server"));
                      return;
                    }
                    toast.success(t("toast.backFromTrash"));
                    if (back.href) router.push(back.href);
                  });
                },
              },
            }
          : {}),
      });
      router.push(`/secure-admin-control/content/${contentKey}`);
    });

  // Ctrl/Cmd+S saves (keeping the record's status).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        document.getElementById("editor-save")?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showDraft =
    !draftHandled &&
    loadedDraft !== null &&
    JSON.stringify(loadedDraft.value) !== JSON.stringify(input.initial);

  return {
    value,
    saved,
    dirty,
    pending,
    errors,
    notice,
    conflict,
    leaveTo,
    keptAt,
    isNew,
    live,
    draft: showDraft ? loadedDraft : null,
    draftIsOlder:
      showDraft &&
      typeof loadedDraft?.baseVersion === "number" &&
      typeof input.version === "number" &&
      loadedDraft.baseVersion < input.version,
    slugFollows: (pattern: string) => following.has(pattern),
    change,
    update,
    touch,
    save,
    discard,
    restoreDraft,
    dropDraft,
    resolveConflict,
    stay: () => setLeaveTo(null),
    leave,
    duplicate,
    remove,
    scheduling,
    openSchedule: () => setScheduling(true),
    closeSchedule: () => setScheduling(false),
    dismissNotice: () => setNotice(null),
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
