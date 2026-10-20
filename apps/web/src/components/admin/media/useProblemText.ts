"use client";

import { useTranslations } from "next-intl";
import type { MediaKind } from "@waafa/shared";
import type { UploadProblem } from "./useUploadQueue";

/** Why an upload failed, in plain words with the next step ("Choose an MP4 or WebM video."). */
export function useProblemText() {
  const t = useTranslations("Admin.media.problem");
  return (problem: UploadProblem | undefined, kind: MediaKind): string =>
    problem === "type" || problem === "size" ? t(`${problem}.${kind}`) : t(problem ?? "server");
}
