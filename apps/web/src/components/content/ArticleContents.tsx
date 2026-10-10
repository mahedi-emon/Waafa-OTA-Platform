type ArticleContentsProps = {
  label: string;
  items: Array<{ id: string; heading: string }>;
};

/** "On this page" list for long pages (policies, blog posts): anchors to each section, sticky beside the text. */
function ArticleContents({ label, items }: ArticleContentsProps) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className="lg:sticky lg:top-[calc(var(--hdr-h)+16px)] lg:self-start">
      <p className="mb-2 text-[13px] font-bold tracking-[0.12em] text-mist-600 uppercase">
        {label}
      </p>
      <ol className="flex flex-col border-l border-mist-200">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="-ml-px flex min-h-11 items-center border-l-2 border-transparent pl-4 text-[14.5px] font-medium text-ink-900 outline-none hover:border-electric-600 hover:text-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {item.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { ArticleContents };
