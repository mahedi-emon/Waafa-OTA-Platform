import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getActiveAnnouncement } from "@/lib/data/settings";
import { AnnouncementShell } from "./AnnouncementShell";

/** Announcement above the header (FR-GLB-03): admin text, link and date range; dismissible; hidden when none is live. */
async function AnnouncementBar() {
  const [announcement, t] = await Promise.all([getActiveAnnouncement(), getTranslations("Layout")]);
  if (!announcement) return null;

  return (
    <AnnouncementShell id={announcement.id} dismissLabel={t("dismiss")}>
      <span className="text-white/90">{announcement.text}</span>
      {announcement.link ? (
        <>
          {" "}
          <Link
            href={announcement.link.href}
            className="font-semibold whitespace-nowrap text-cyan-400 underline decoration-cyan-400/50 underline-offset-4 hover:decoration-cyan-400"
          >
            {announcement.link.label}
          </Link>
        </>
      ) : null}
    </AnnouncementShell>
  );
}

export { AnnouncementBar };
