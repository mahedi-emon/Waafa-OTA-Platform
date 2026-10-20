"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@waafa/shared";
import { markSignedOut } from "../sessionStore";
import { uploadMedia } from "./uploadMedia";
import { nextToStart, retried, type UploadItem } from "./uploadQueue";

export type { UploadItem, UploadProblem } from "./uploadQueue";

type UploadQueueOptions = {
  /** The alt text a file is uploaded with (staff improve it afterwards). */
  altFor: (file: File) => string;
  onUploaded?: (asset: MediaAsset, item: UploadItem) => void;
};

let counter = 0;

/**
 * Uploads chosen or dropped files one after another (two at a time) with progress, Retry for the ones that failed
 * and Cancel. Files are checked in the browser first (type, size), so a wrong file fails at once with its reason.
 */
export function useUploadQueue({ altFor, onUploaded }: UploadQueueOptions) {
  const [items, setItems] = useState<UploadItem[]>([]);
  // The queue as the scheduler sees it (updated with every change, read only in handlers).
  const queue = useRef<UploadItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const latest = useRef({ altFor, onUploaded });
  useEffect(() => {
    latest.current = { altFor, onUploaded };
  });

  const commit = useCallback((next: UploadItem[]) => {
    queue.current = next;
    setItems(next);
  }, []);
  const patch = useCallback(
    (key: string, part: Partial<UploadItem>) =>
      commit(queue.current.map((item) => (item.key === key ? { ...item, ...part } : item))),
    [commit],
  );

  // The scheduler calls itself again when an upload ends, through this ref (set below, read in callbacks).
  const pumpAgain = useRef<() => void>(() => undefined);
  // Starts waiting files while fewer than two are on their way.
  const pump = useCallback(() => {
    for (const item of nextToStart(queue.current)) {
      const controller = new AbortController();
      controllers.current.set(item.key, controller);
      patch(item.key, { status: "uploading", progress: 0 });
      void uploadMedia(
        item.file,
        { alt: latest.current.altFor(item.file) },
        (progress) => patch(item.key, { progress }),
        controller.signal,
      ).then((outcome) => {
        controllers.current.delete(item.key);
        if (controller.signal.aborted) return;
        if (outcome.ok) {
          patch(item.key, { status: "done", progress: 1, asset: outcome.asset });
          latest.current.onUploaded?.(outcome.asset, item);
        } else {
          if (outcome.reason === "signedOut") markSignedOut();
          patch(item.key, { status: "failed", problem: outcome.reason });
        }
        pumpAgain.current();
      });
    }
  }, [patch]);
  useEffect(() => {
    pumpAgain.current = pump;
  }, [pump]);

  const add = useCallback(
    (files: File[], tag?: string) => {
      const added = files.map<UploadItem>((file) => ({
        key: `upload-${(counter += 1)}`,
        file,
        ...(tag ? { tag } : {}),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        status: "waiting",
      }));
      commit([...queue.current, ...added]);
      pump();
      return added.map((item) => item.key);
    },
    [commit, pump],
  );

  const retry = useCallback(
    (key: string) => {
      commit(
        queue.current.map((item) =>
          item.key === key && item.status === "failed" ? retried(item) : item,
        ),
      );
      pump();
    },
    [commit, pump],
  );

  /** Cancels an upload on its way, or forgets a finished or failed one. */
  const dismiss = useCallback(
    (key: string) => {
      controllers.current.get(key)?.abort();
      controllers.current.delete(key);
      const gone = queue.current.find((item) => item.key === key);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      commit(queue.current.filter((item) => item.key !== key));
      pump();
    },
    [commit, pump],
  );

  /** Forgets every finished upload (after they were added to the field or the list reloaded). */
  const clearDone = useCallback(() => {
    for (const item of queue.current)
      if (item.status === "done" && item.preview) URL.revokeObjectURL(item.preview);
    commit(queue.current.filter((item) => item.status !== "done"));
  }, [commit]);

  // Leaving the page cancels uploads on their way and frees the previews.
  useEffect(() => {
    const running = controllers.current;
    const current = queue;
    return () => {
      for (const controller of running.values()) controller.abort();
      for (const item of current.current) if (item.preview) URL.revokeObjectURL(item.preview);
    };
  }, []);

  const busy = items.some((item) => item.status === "waiting" || item.status === "uploading");
  return { items, add, retry, dismiss, clearDone, busy };
}
