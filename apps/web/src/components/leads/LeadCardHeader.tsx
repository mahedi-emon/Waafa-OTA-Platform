import { CircleCheck } from "@/components/icons/serverIcons";

type LeadCardHeaderProps = {
  kicker: string;
  title: string;
  lead: string;
  /** The two promises under the lead ("No payment now", "Price confirmed by an expert"). */
  badges: string[];
  /** The title's id; without it (the loading preview) the title is not a heading. */
  titleId?: string;
};

/**
 * The lead request card's header: kicker, title, lead and the two promises on the soft ribbon. Shared by the card and
 * by its loading preview, so the page's largest text paints with the first HTML (issue 170).
 */
function LeadCardHeader({ kicker, title, lead, badges, titleId }: LeadCardHeaderProps) {
  const titleClass =
    "font-display text-[24px] leading-[1.12] font-extrabold tracking-tight text-balance text-navy-900 md:text-[30px]";
  return (
    <header className="flex flex-col gap-2 border-b border-mist-200 bg-(image:--ribbon-soft) px-5 py-6 md:px-7 md:py-7">
      <p className="flex items-center gap-2 type-label text-brand-700">
        <span aria-hidden="true" className="h-px w-6 bg-brand-700" />
        {kicker}
      </p>
      {titleId ? (
        <h2 id={titleId} className={titleClass}>
          {title}
        </h2>
      ) : (
        <p className={titleClass}>{title}</p>
      )}
      <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-mist-600">{lead}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {badges.map((text) => (
          <li
            key={text}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[12.5px] font-semibold text-navy-900 ring-1 ring-mist-200"
          >
            <CircleCheck aria-hidden="true" className="size-3.5 text-success-600" />
            {text}
          </li>
        ))}
      </ul>
    </header>
  );
}

export { LeadCardHeader };
