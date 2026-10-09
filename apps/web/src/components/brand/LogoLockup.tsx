import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { Link } from "@/i18n/navigation";
import markImage from "@/assets/brand/waafa-mark.png";
import wordmarkImage from "@/assets/brand/waafa-wordmark.png";

type LogoLockupProps = {
  /** Show the three-line tagline from 768 px (header and footer). Off in drawers and tight spots. */
  tagline?: boolean;
  /** Breakpoint from which the tagline shows: md (footer) or xl (header, where the nav needs the room below 1280 px). */
  taglineFrom?: "md" | "lg" | "xl";
  /** Render as a link to Home (default) or as a plain image group. */
  asLink?: boolean;
  className?: string;
};

/**
 * The WAAFA lockup (Brand board, PRD §16): W mark + WAAFA wordmark + tagline in small caps.
 * Uses the supplied logo cut-outs, untouched; never recoloured and only placed on white or mist-50.
 * Phone: W 32 px, wordmark 15 px, no tagline. From 768 px: W 40 px, wordmark 19 px, tagline.
 * The vector originals replace these images when the owner sends them (TRACKER owner questions).
 */
function LogoLockup({
  tagline = true,
  taglineFrom = "md",
  asLink = true,
  className,
}: LogoLockupProps) {
  const t = useTranslations("Brand");

  const content = (
    <>
      <Image
        src={markImage}
        alt=""
        width={66}
        height={40}
        loading="eager"
        className="h-8 w-[53px] shrink-0 object-contain md:h-10 md:w-[66px]"
      />
      <Image
        src={wordmarkImage}
        alt=""
        width={113}
        height={19}
        loading="eager"
        className="h-[15px] w-[89px] shrink-0 object-contain md:h-[19px] md:w-[113px]"
      />
      {tagline ? (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "mx-0.5 hidden h-8 w-px bg-mist-300",
              taglineFrom === "xl" ? "xl:block" : taglineFrom === "lg" ? "lg:block" : "md:block",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "hidden text-[8.8px] leading-[1.34] font-semibold tracking-[0.1em] whitespace-nowrap text-mist-600 uppercase xl:text-[9.6px]",
              taglineFrom === "xl" ? "xl:block" : taglineFrom === "lg" ? "lg:block" : "md:block",
            )}
          >
            {t("taglineLine1")}
            <br />
            {t("taglineLine2")}
            <br />
            {t("taglineLine3")}
          </span>
        </>
      ) : null}
    </>
  );

  const classes = cn("flex shrink-0 items-center gap-[9px] md:gap-3", className);

  if (!asLink) {
    return (
      <span role="img" aria-label={t("name")} className={classes}>
        {content}
      </span>
    );
  }

  return (
    <Link href="/" aria-label={t("homeLabel")} className={cn(classes, "rounded-sm")}>
      {content}
    </Link>
  );
}

export { LogoLockup };
