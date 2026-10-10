import type { BlogPost } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";
import { Link } from "@/i18n/navigation";

type BlogCardProps = {
  post: BlogPost;
  categoryName?: string;
  minutesLabel: string;
  sizes?: string;
};

/** Travel guide card: cover, category, title and reading time; the whole card links to the post. */
function BlogCard({
  post,
  categoryName,
  minutesLabel,
  sizes = "(min-width: 1024px) 400px, 85vw",
}: BlogCardProps) {
  return (
    <article className="group relative flex h-full flex-col gap-3">
      <SmartImage
        src={post.cover.src}
        alt={post.cover.alt}
        ratio="16/10"
        sizes={sizes}
        frameClassName="rounded-2xl"
        zoomOnHover
      />
      <div className="flex flex-col gap-1.5">
        {categoryName ? (
          <p className="text-[13px] font-semibold text-brand-700">{categoryName}</p>
        ) : null}
        <h3 className="font-display text-[17px] leading-snug font-bold text-navy-900">
          <Link
            href={`/blog/${post.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-[13px] text-mist-600">{minutesLabel}</p>
      </div>
    </article>
  );
}

export { BlogCard };
