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
        "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:rounded-xl [&_table]:border [&_table]:border-mist-200 [&_table]:text-left [&_table]:text-[15px]",
        "[&_caption]:px-3 [&_caption]:py-2 [&_caption]:text-left [&_caption]:text-[13px] [&_caption]:text-mist-600 [&_td]:border-t [&_td]:border-mist-100 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-mist-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-navy-900",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}

export { RichText };
