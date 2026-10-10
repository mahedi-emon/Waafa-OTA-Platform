import { getTranslations } from "next-intl/server";
import type { HomeContent, HomeSection } from "@waafa/shared";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { listTimeline, listValues } from "@/lib/data/content";
import { HomeSectionShell } from "./HomeSectionShell";

type WhySectionProps = { section: HomeSection; why: HomeContent["why"] };

/**
 * Why WAAFA (FR-HOME 8): the figure the owner gave (no invented counters), the story, the journey and the six
 * values as a bento (the first value spans two columns on desktop).
 */
async function WhySection({ section, why }: WhySectionProps) {
  const [values, timeline, t, tHome] = await Promise.all([
    listValues(),
    listTimeline(),
    getTranslations("Home.why"),
    getTranslations("Home"),
  ]);

  return (
    <HomeSectionShell labelledBy="home-why">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="flex flex-col gap-5">
          <p className="type-label text-brand-700">{section.kicker || t("kicker")}</p>
          <h2 id="home-why" className="type-h2 text-navy-900">
            {section.title || tHome("defaults.why")}
          </h2>
          <p className="flex items-baseline gap-3">
            <span className="font-display text-[44px] leading-none font-extrabold tracking-tight text-navy-900 md:text-[56px]">
              {why.figure}
            </span>
            <span className="max-w-[18ch] text-[14px] leading-snug text-mist-600">
              {why.figureLabel}
            </span>
          </p>
          <p className="max-w-[56ch] type-lead text-mist-700">{why.body}</p>
          {timeline.length > 0 ? (
            <div>
              <h3 className="mb-3 text-[13.5px] font-semibold text-mist-700">{t("journey")}</h3>
              <ol className="relative flex flex-col gap-4 border-l-2 border-mist-200 pl-5">
                {timeline.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-white bg-electric-600 ring-1 ring-electric-200"
                    />
                    <p className="font-display text-[14px] font-bold text-navy-900">
                      {event.period}
                    </p>
                    <p className="text-[14px] leading-snug text-mist-700">{event.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
        {values.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-3 sm:grid-cols-2 sm:gap-3">
            {values.map((value, index) => (
              <li
                key={value.id}
                className={
                  index === 0
                    ? "mb-2 flex flex-col gap-2 rounded-2xl bg-navy-900 p-5 text-white sm:col-span-2 sm:mb-0"
                    : "grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-mist-200 py-4 last:border-b-0 sm:flex sm:flex-col sm:gap-2 sm:rounded-2xl sm:border sm:bg-white sm:p-5 sm:last:border-b"
                }
              >
                <span
                  className={
                    index === 0
                      ? "grid size-10 place-items-center rounded-xl bg-white/10 text-cyan-400"
                      : "row-span-2 grid size-10 place-items-center rounded-xl bg-electric-50 text-brand-700"
                  }
                >
                  <MenuIcon name={value.icon} className="size-5" />
                </span>
                <h3
                  className={
                    index === 0
                      ? "font-display text-[18px] font-bold"
                      : "font-display text-[16px] font-bold text-navy-900"
                  }
                >
                  {value.title}
                </h3>
                <p
                  className={
                    index === 0
                      ? "text-[14px] leading-relaxed text-white/80"
                      : "text-[14px] leading-relaxed text-mist-600"
                  }
                >
                  {value.body}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </HomeSectionShell>
  );
}

export { WhySection };
