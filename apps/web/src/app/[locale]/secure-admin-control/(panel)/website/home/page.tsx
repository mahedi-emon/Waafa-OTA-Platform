import { Suspense } from "react";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { canEditContentKey, type ContentOption } from "@waafa/shared";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HomeSectionManager } from "@/components/admin/website/HomeSectionManager";
import type { HeroData, ManagedSection } from "@/components/admin/website/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { adminGet, requireStaff } from "@/lib/admin/adminApi";
import { HOME_SECTIONS, THUMB_SOURCES, type HomeSectionKey } from "@/lib/admin/homeSections";
import type {
  ContentRecordResponse,
  ContentRecordsPage,
  ContentSingleton,
} from "@/lib/admin/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.website");
  return { title: t("home.metaTitle") };
}

/** Only the manager's, the sheets' and the drag list's words reach the browser (scoped provider, D190). */
const MANAGER_MESSAGES = ["Admin.website", "Admin.editor.widgets"];
const CONTENT = "/secure-admin-control/content";

type HeroCopy = {
  title: string;
  titleAccent: string;
  lead: string;
  rotatingLabel: string;
  rotating: string[];
};
type SlotMedia = {
  image?: { src?: string };
  video?: { poster?: { src?: string }; mp4Mobile?: string };
};

async function HomeManager({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [staff, t, tc, tHome, messages, search] = await Promise.all([
    requireStaff(),
    getTranslations("Admin.website"),
    getTranslations("Admin.content"),
    getTranslations("Home"),
    getMessages(),
    searchParams,
  ]);
  if (!canEditContentKey(staff.roles, "homeSections")) {
    const tf = await getTranslations("Admin.forbidden");
    return <AdminPageHeader title={tf("title")} lead={tf("body")} />;
  }
  const [records, copy, slot, site, thumbs] = await Promise.all([
    adminGet<ContentRecordsPage>("/admin/content/homeSections/records", { pageSize: 100 }),
    adminGet<ContentSingleton>("/admin/content/homeContent"),
    adminGet<ContentRecordResponse>("/admin/content/mediaSlots/home-hero").catch(() => null),
    // The store's name is the Waafas World section's standard small line; settings may be closed to this role.
    adminGet<ContentSingleton>("/admin/content/siteSettings").catch(() => null),
    Promise.all(
      THUMB_SOURCES.map((key) =>
        adminGet<{ items: ContentOption[] }>(`/admin/content/${key}/options`)
          .then(
            (options) => [key, options.items.find((item) => item.image)?.image ?? null] as const,
          )
          .catch(() => [key, null] as const),
      ),
    ),
  ]);
  const thumbOf = new Map<string, string | null>(thumbs);
  const media = (slot?.data ?? {}) as SlotMedia;
  const heroSrc = media.image?.src ?? media.video?.poster?.src ?? null;
  const contentLink = (key: string) => ({
    label: tc(`keys.${key}` as "keys.banners"),
    href: key === "mediaSlots" ? `${CONTENT}/mediaSlots/home-hero` : `${CONTENT}/${key}`,
  });

  const homeCopy = copy.value as { store?: { title?: string; body?: string } };
  const storeName = String((site?.value as { storeName?: unknown } | undefined)?.storeName ?? "");
  // The words each section shows when a box is left empty, as the public sections choose them.
  const defaultsOf = (key: HomeSectionKey): ManagedSection["defaults"] => {
    if (key === "store") {
      return {
        kicker: storeName,
        title: homeCopy.store?.title ?? "",
        subtitle: homeCopy.store?.body ?? "",
      };
    }
    const title = `defaults.${key}` as "defaults.offers";
    return {
      kicker: key === "why" ? tHome("why.kicker") : "",
      title: tHome.has(title) ? tHome(title) : "",
      subtitle: "",
    };
  };

  const sections: ManagedSection[] = records.items.map((item) => {
    const data = (item.data ?? {}) as Record<string, unknown>;
    const key = String(data.key ?? item.id) as HomeSectionKey;
    const info = HOME_SECTIONS[key];
    const text = (name: string) => (typeof data[name] === "string" ? (data[name] as string) : "");
    return {
      key,
      name: t(`sections.${key}.name`),
      lead: t(`sections.${key}.lead`),
      enabled: data.enabled !== false,
      version: item.version,
      data,
      headings: info?.headings ?? false,
      kicker: text("kicker"),
      title: text("title"),
      subtitle: text("subtitle"),
      defaults: defaultsOf(key),
      thumb:
        key === "hero" ? heroSrc : info?.thumbFrom ? (thumbOf.get(info.thumbFrom) ?? null) : null,
      links: (info?.content ?? [])
        .filter((contentKey) => canEditContentKey(staff.roles, contentKey))
        .map(contentLink),
    };
  });

  const heroCopy = ((copy.value as { hero?: HeroCopy }).hero ?? {
    title: "",
    titleAccent: "",
    lead: "",
    rotatingLabel: "",
    rotating: [],
  }) as HeroCopy;
  const hero: HeroData = {
    ...heroCopy,
    content: copy.value as Record<string, unknown>,
    version: copy.version,
    media: {
      kind: media.video ? "video" : media.image ? "photo" : "none",
      src: heroSrc,
      phoneVersion: Boolean(media.video?.mp4Mobile),
    },
    mediaHref: `${CONTENT}/mediaSlots/home-hero`,
  };
  const wanted = typeof search.section === "string" ? search.section : null;
  const initialSection =
    wanted && (wanted === "hero" || sections.some((s) => s.key === wanted)) ? wanted : null;

  return (
    <>
      <AdminPageHeader
        title={t("home.title")}
        lead={t("home.lead")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href="/" target="_blank" rel="noopener">
              <ExternalLink aria-hidden="true" className="size-4" />
              {t("home.view")}
            </a>
          </Button>
        }
      />
      <section aria-labelledby="home-sections" className="flex flex-col gap-3">
        <div>
          <h2 id="home-sections" className="font-display text-[18px] font-bold text-navy-900">
            {t("home.sectionsTitle")}
          </h2>
          <p className="text-[14px] text-mist-600">{t("home.sectionsLead")}</p>
        </div>
        <NextIntlClientProvider messages={pickMessagePaths(messages, MANAGER_MESSAGES)}>
          <HomeSectionManager sections={sections} hero={hero} initialSection={initialSection} />
        </NextIntlClientProvider>
      </section>
    </>
  );
}

/** Website › Home page (ADMIN.md §5.8, D0 R7): the home sections in order, shown or hidden, each with its editor. */
export default function HomePageManager(
  props: PageProps<"/[locale]/secure-admin-control/website/home">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-160 rounded-2xl" />}>
      <HomeManager searchParams={props.searchParams} />
    </Suspense>
  );
}
