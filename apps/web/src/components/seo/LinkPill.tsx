import { ArrowRight } from "@/components/icons/server/ArrowRight";
import { LocalLink as Link } from "@/components/nav/LocalLink";

type LinkPillProps = { href: string; children: string };

/**
 * A rounded text link to another page (Explore more): at least 44 px tall, the arrow in brand blue; a long title wraps
 * inside the same rounded shape.
 */
function LinkPill({ href, children }: LinkPillProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-[22px] border border-mist-200 bg-white px-4 py-2 text-[14px] leading-snug font-semibold text-navy-900 transition-colors duration-150 outline-none hover:border-mist-300 hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-brand-700" />
    </Link>
  );
}

export { LinkPill };
