import { cn } from "cn";
import { sanitizeRichText } from "@/lib/content/sanitizeRichText";

type RichTextProps = { html: string; className?: string };

/**
 * Admin rich text (pages, guides, posts), sanitised on the server with an allow-list. One of the two places allowed to
 * set raw HTML (Decision D38).
 */
function RichText({ html, className }: RichTextProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-[16px] leading-relaxed text-ink-900",
        "[&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-4",
        "[&_h3]:mt-2 [&_h3]:font-display [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-navy-900",
        "[&_li]:marker:text-mist-400 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-electric-200 [&_blockquote]:pl-4 [&_blockquote]:text-mist-700",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}

export { RichText };
