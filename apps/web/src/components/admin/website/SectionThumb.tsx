import Image from "next/image";
import {
  BadgeCheck,
  ImageIcon,
  Luggage,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  Plane,
  ShoppingBag,
  Sparkles,
  Stamp,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import type { HomeSectionKey } from "@/lib/admin/homeSections";

/** Sections without a photo of their own (or with none yet) get an icon that says what they are. */
const ICONS: Record<HomeSectionKey, LucideIcon> = {
  hero: ImageIcon,
  trust: BadgeCheck,
  offers: Tag,
  groupFares: Plane,
  destinations: MapPin,
  packages: Luggage,
  visa: Stamp,
  why: Sparkles,
  store: ShoppingBag,
  testimonials: MessageSquareQuote,
  galleryBlogFaq: Newspaper,
  team: Users,
  cta: Megaphone,
};

type SectionThumbProps = {
  section: HomeSectionKey;
  /** A photo from the section's own content (the hero's photo or video poster, the first package's cover…). */
  src: string | null;
  className?: string;
};

/** A home section's small picture in the manager: its own content's photo, or its icon. */
function SectionThumb({ section, src, className }: SectionThumbProps) {
  const box = cn(
    "relative flex aspect-[16/10] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-mist-200 bg-mist-50 sm:w-28",
    className,
  );
  if (!src) {
    const Icon = ICONS[section];
    return (
      <span aria-hidden="true" className={cn(box, "text-mist-500")}>
        <Icon className="size-6" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={box}>
      <Image
        src={src}
        alt=""
        fill
        sizes="112px"
        unoptimized={/^https?:\/\//.test(src)}
        className="object-cover"
      />
    </span>
  );
}

export { SectionThumb };
