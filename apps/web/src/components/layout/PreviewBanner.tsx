import { draftMode } from "next/headers";
import { getTranslations } from "next-intl/server";
import { PreviewExitLink } from "./PreviewExitLink";

/**
 * "Preview of unpublished changes" (D0 R7): only in Next.js draft mode, which only staff can turn on. Reading draft
 * mode while the site is built returns off without making the page dynamic, so every page stays static and
 * visitors never see the banner.
 */
async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  const t = await getTranslations("Layout.preview");

  return (
    <div
      role="status"
      className="relative z-50 border-b border-warning-700/25 bg-warning-50 text-warning-800"
    >
      <div className="site-container flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
        <p className="text-[14px] leading-snug">
          <span className="font-semibold">{t("title")}.</span> <span>{t("body")}</span>
        </p>
        <PreviewExitLink label={t("exit")} />
      </div>
    </div>
  );
}

export { PreviewBanner };
