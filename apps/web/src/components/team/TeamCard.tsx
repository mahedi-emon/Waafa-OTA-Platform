import { cn } from "cn";
import type { TeamMember } from "@waafa/shared";
import { SmartImage } from "@/components/media/SmartImage";

type TeamCardProps = {
  member: TeamMember;
  /** Larger card for the featured person in the desktop bento. */
  featured?: boolean;
  badges?: string[];
  className?: string;
};

/**
 * Meet our team card (FR-TEAM): a real photo when uploaded, otherwise initials on the brand ribbon (never a stock
 * face), name, designation and department.
 */
function TeamCard({ member, featured = false, badges = [], className }: TeamCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white",
        className,
      )}
    >
      <div className={cn("relative", featured && "md:flex md:flex-1 md:flex-col")}>
        {member.photo ? (
          <SmartImage
            src={member.photo.src}
            alt={member.photo.alt}
            ratio="4/5"
            sizes={featured ? "(min-width: 768px) 30vw, 80vw" : "(min-width: 768px) 20vw, 70vw"}
            frameClassName="h-full"
          />
        ) : (
          <div
            aria-hidden="true"
            className={cn(
              "grid aspect-[4/3] h-full w-full place-items-center bg-(image:--ribbon) font-display font-extrabold text-white",
              featured ? "text-[56px] md:aspect-auto md:flex-1 md:text-[88px]" : "text-[40px]",
            )}
          >
            {member.initials}
          </div>
        )}
      </div>
      <div className={cn("flex flex-col gap-1 p-4", featured && "md:p-6")}>
        {badges.length > 0 ? (
          <div className="mb-1 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-[7px] bg-mist-100 px-2 py-0.5 text-[12px] font-semibold text-mist-700"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        <h3
          className={cn(
            "font-display font-bold text-navy-900",
            featured ? "text-[20px]" : "text-[16px]",
          )}
        >
          {member.name}
        </h3>
        <p className="text-[13.5px] text-ink-900">{member.designation}</p>
        <p className="text-[12.5px] text-mist-600">{member.department}</p>
        {featured && member.bio ? (
          <p className="mt-2 text-[14px] leading-relaxed text-mist-700">{member.bio}</p>
        ) : null}
      </div>
    </article>
  );
}

export { TeamCard };
