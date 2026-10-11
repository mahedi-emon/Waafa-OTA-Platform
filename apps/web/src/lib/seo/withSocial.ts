import "server-only";
import type { Metadata } from "next";
import { getMediaSlot } from "@/lib/data/content";
import { getSiteSettings } from "@/lib/data/settings";
import { absoluteUrl } from "@/lib/siteUrl";

type ShareImage = { url: string; alt: string; width?: number; height?: number };

type SocialOptions = {
  /** "article" for blog posts and visa guides. */
  type?: "website" | "article";
  /** The page's own photo (package cover, product, post); otherwise the admin default. */
  image?: ShareImage;
};

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
  return {
    url: typeof image.src === "string" ? image.src : String(image.src),
    alt: image.alt,
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
  };
}

/**
 * Adds the share preview a page needs on Facebook, WhatsApp, LinkedIn and X (#96): og:title, description, url,
 * site name, en_BD locale, type and image, plus a large Twitter card, all derived from the page's own title,
 * description and canonical. Values the page already set win; without an image the admin default is used.
 * Next merges metadata shallowly, so every public page passes its metadata through here.
 */
export async function withSocial(
  metadata: Metadata,
  options: SocialOptions = {},
): Promise<Metadata> {
  const [site, fallback] = await Promise.all([getSiteSettings(), defaultShareImage()]);
  const title = titleText(metadata.title) ?? site.defaultSeo.title ?? site.travelBrand;
  const description =
    (typeof metadata.description === "string" ? metadata.description : undefined) ??
    site.defaultSeo.description;
  const canonical = metadata.alternates?.canonical;
  const url =
    typeof canonical === "string"
      ? absoluteUrl(canonical)
      : canonical instanceof URL
        ? canonical.toString()
        : undefined;
  const existing = (metadata.openGraph ?? {}) as Record<string, unknown>;
  const image = options.image ?? fallback;
  const images = (existing.images as unknown) ?? (image ? [image] : undefined);

  return {
    ...metadata,
    openGraph: {
      siteName: site.travelBrand,
      locale: "en_BD",
      type: options.type ?? "website",
      title,
      ...(description ? { description } : {}),
      ...(url ? { url } : {}),
      ...(images ? { images } : {}),
      ...existing,
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
