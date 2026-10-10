import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import type { HomeSection } from "@waafa/shared";
import { SampleBadge } from "@/components/content/SampleBadge";
import { SectionHeading } from "@/components/content/SectionHeading";
import { TeamCard } from "@/components/team/TeamCard";
import { listTeam } from "@/lib/data/content";
import { HomeSectionShell } from "./HomeSectionShell";

/**
 * Meet our team (FR-TEAM, correction 6): a bento on desktop (the featured person takes a 2×2 tile) and a snap
 * carousel on phones; hidden when no one is marked for Home. Initials until real photos are uploaded.
 */
async function TeamSection({ section }: { section: HomeSection }) {
  const [team, t, tHome] = await Promise.all([
    listTeam("home"),
    getTranslations("Home.team"),
    getTranslations("Home"),
  ]);
  if (team.length === 0) return null;
  const ordered = [...team].sort((a, b) => Number(b.featured) - Number(a.featured));

  return (
    <HomeSectionShell labelledBy="home-team" tone="mist">
      <SectionHeading
        id="home-team"
        kicker={section.kicker}
        title={section.title || tHome("defaults.team")}
        subtitle={section.subtitle}
        action={{ href: "/about-us#team", label: t("all") }}
        aside={
          team.some((m) => m.sample) ? (
            <SampleBadge label={tHome("sample")} title={tHome("sampleNote")} />
          ) : null
        }
      />
      <ul
        tabIndex={0}
        aria-labelledby="home-team"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 md:mx-0 md:grid md:snap-none md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 md:pb-0"
      >
        {ordered.slice(0, 7).map((member, index) => {
          const featured = index === 0 && member.featured;
          return (
            <li
              key={member.id}
              className={cn(
                "w-[62%] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none",
                featured && "md:col-span-2 md:row-span-2",
              )}
            >
              <TeamCard
                member={member}
                featured={featured}
                badges={[
                  featured ? t("featured") : null,
                  member.sample ? tHome("sample") : null,
                ].filter((badge): badge is string => badge !== null)}
              />
            </li>
          );
        })}
      </ul>
      <p className="text-[13px] text-mist-600 md:hidden">{t("swipe")}</p>
    </HomeSectionShell>
  );
}

export { TeamSection };
