import "server-only";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMediaSlot } from "@/lib/data/content";
import { getSiteSettings } from "@/lib/data/settings";
import { type ShareImage, shareImageSrc, sharePreview } from "@/lib/media/imageQuality";
import { absoluteUrl } from "@/lib/siteUrl";
import { clampText, DESCRIPTION_MAX, fitTitle, TITLE_MAX } from "./metaText";

type SocialOptions = {
  /** "article" for blog posts and visa guides. */
  type?: "website" | "article";
  /** The page's own photo (package cover, product, post); otherwise the admin default. */
  image?: ShareImage;
};

/** Open Graph images a page set itself ("/media/…" strings or { url, alt, width, height }), resized the same way. */
function sharePreviews(images: unknown): unknown {
  const list: unknown[] = Array.isArray(images) ? images : [images];
  return list.map((item) => {
    if (typeof item === "string") return { url: shareImageSrc(item) };
    if (item && typeof item === "object" && "url" in item && typeof item.url === "string") {
      const record = item as Record<string, unknown> & { url: string };
      const width = typeof record.width === "number" ? record.width : undefined;
      const height = typeof record.height === "number" ? record.height : undefined;
      const alt = typeof record.alt === "string" ? record.alt : "";
      return {
        ...record,
        ...sharePreview({
          url: record.url,
          alt,
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        }),
      };
    }
    return item;
  });
}

function titleText(title: Metadata["title"]): string | undefined {
  if (!title) return undefined;
  if (typeof title === "string") return title;
  if ("absolute" in title && title.absolute) return title.absolute;
  if ("default" in title && title.default) return title.default;
  return undefined;
}

/**
 * The share image every page falls back to (FR-SEO): Settings › General › default SEO image, else the Home hero
 * poster, both admin-managed. Never a stock or generated image.
 */
export async function defaultShareImage(): Promise<ShareImage | undefined> {
  const [site, hero] = await Promise.all([getSiteSettings(), getMediaSlot("home-hero")]);
  const image = site.defaultSeo.image ?? hero?.image ?? hero?.video?.poster;
  if (!image) return undefined;
  return sharePreview({
    url: typeof image.src === "string" ? image.src : String(image.src),
    alt: image.alt,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  });
}

/**
 * Fits the page title into what search results show (issue 173): the "| Waafa" template only when the whole title
 * stays within 60 characters, else the page title alone, shortened at a word if it is still too long.
 */
function fitPageTitle(title: Metadata["title"], template: string): Metadata["title"] {
  if (typeof title === "string") {
    const fitted = fitTitle(title, template);
    return fitted.absolute ? { absolute: fitted.title } : fitted.title;
  }
  if (title && "absolute" in title && title.absolute) {
    return { ...title, absolute: clampText(title.absolute, TITLE_MAX) };
  }
  return title;
}

/**
 * Adds the share preview a page needs on Facebook, WhatsApp, LinkedIn and X (#96): og:title, description, url,
 * site name, en_BD locale, type and image, plus a large Twitter card, all derived from the page's own title,
 * description and canonical. Values the page already set win; without an image the admin default is used.
 * Next merges metadata shallowly, so every public page passes its metadata through here. Titles and descriptions
 * are kept within 60 and 155 characters (issue 173), whatever length an admin record has.
 */
export async function withSocial(
  metadata: Metadata,
  options: SocialOptions = {},
): Promise<Metadata> {
  const [site, fallback, t] = await Promise.all([
    getSiteSettings(),
    defaultShareImage(),
    getTranslations("Metadata"),
  ]);
  const pageTitle = fitPageTitle(metadata.title, t("titleTemplate"));
  const title = titleText(pageTitle) ?? site.defaultSeo.title ?? site.travelBrand;
  const rawDescription =
    (typeof metadata.description === "string" ? metadata.description : undefined) ??
    site.defaultSeo.description;
  const description = rawDescription ? clampText(rawDescription, DESCRIPTION_MAX) : undefined;
  const canonical = metadata.alternates?.canonical;
  const url =
    typeof canonical === "string"
      ? absoluteUrl(canonical)
      : canonical instanceof URL
        ? canonical.toString()
        : undefined;
  const existing = (metadata.openGraph ?? {}) as Record<string, unknown>;
  const image = options.image ?? fallback;
  const images =
    existing.images !== undefined
      ? sharePreviews(existing.images)
      : image
        ? [sharePreview(image)]
        : undefined;

  return {
    ...metadata,
    ...(pageTitle ? { title: pageTitle } : {}),
    ...(typeof metadata.description === "string" && description ? { description } : {}),
    openGraph: {
      siteName: site.travelBrand,
      locale: "en_BD",
      type: options.type ?? "website",
      title,
      ...(description ? { description } : {}),
      ...(url ? { url } : {}),
      ...existing,
      ...(images ? { images } : {}),
    } as Metadata["openGraph"],
    twitter: {
      card: "summary_large_image",
      title,
      ...(description ? { description } : {}),
      ...(images ? { images } : {}),
      ...((metadata.twitter ?? {}) as Record<string, unknown>),
    } as Metadata["twitter"],
  };
}
