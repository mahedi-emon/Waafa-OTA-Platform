import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isStyleguideEnabled } from "@/lib/flags";
import { BadgeShowcase } from "./_components/BadgeShowcase";
import { BrandShowcase } from "./_components/BrandShowcase";
import { ButtonShowcase } from "./_components/ButtonShowcase";
import { ChoiceShowcase } from "./_components/ChoiceShowcase";
import { ColorSwatches } from "./_components/ColorSwatches";
import { DataShowcase } from "./_components/DataShowcase";
import { FeedbackShowcase } from "./_components/FeedbackShowcase";
import { FieldShowcase } from "./_components/FieldShowcase";
import { MediaShowcase } from "./_components/MediaShowcase";
import { MotionShowcase } from "./_components/MotionShowcase";
import { OverlayShowcase } from "./_components/OverlayShowcase";
import { StyleguideSection } from "./_components/StyleguideSection";
import { TypeScale } from "./_components/TypeScale";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const sections = [
  { id: "brand", title: "Brand" },
  { id: "colour", title: "Colour" },
  { id: "type", title: "Type" },
  { id: "buttons", title: "Buttons" },
  { id: "badges", title: "Badges and status" },
  { id: "fields", title: "Text fields" },
  { id: "choices", title: "Choice controls" },
  { id: "overlays", title: "Overlays" },
  { id: "feedback", title: "Feedback and states" },
  { id: "data", title: "Content blocks" },
  { id: "motion", title: "Motion" },
  { id: "media", title: "Media" },
] as const;

/**
 * Developer styleguide (issue #3): every primitive and brand piece in every state. Dev-only and not indexed;
 * production builds return 404 (see lib/flags). Labels here are developer notes, not site copy.
 */
export default function StyleguidePage() {
  if (!isStyleguideEnabled()) notFound();

  return (
    <main id="main" className="site-container grid grid-cols-1 gap-12 py-10 md:py-14">
      <header className="grid gap-3">
        <h1 className="type-h1 text-navy-900">WAAFA styleguide</h1>
        <p className="max-w-[70ch] text-[15px] text-mist-600">
          Tokens from globals.css, shadcn primitives restyled for WAAFA, brand pieces and MotionKit.
          Check every block at 320, 390, 768 and 1440 px and with reduced motion on.
        </p>
        <nav aria-label="Styleguide sections">
          <ul className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex h-8 items-center rounded-full border border-mist-300 px-3 text-[13px] font-semibold text-navy-900"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <StyleguideSection
        id="brand"
        title="Brand"
        note="The logo appears once per page, in the header, on white or mist-50 only."
      >
        <BrandShowcase />
      </StyleguideSection>
      <StyleguideSection
        id="colour"
        title="Colour"
        note="Tailwind's default palette is removed; these are the only colours."
      >
        <ColorSwatches />
      </StyleguideSection>
      <StyleguideSection
        id="type"
        title="Type"
        note="Plus Jakarta Sans for headings and figures, Inter for text."
      >
        <TypeScale />
      </StyleguideSection>
      <StyleguideSection
        id="buttons"
        title="Buttons"
        note="Pills: 48 / 38 / 56 px. Press scales to 0.975; hover fades an overlay."
      >
        <ButtonShowcase />
      </StyleguideSection>
      <StyleguideSection id="badges" title="Badges and status">
        <BadgeShowcase />
      </StyleguideSection>
      <StyleguideSection
        id="fields"
        title="Text fields"
        note="50 px, 16 px text, label above, help and errors below."
      >
        <FieldShowcase />
      </StyleguideSection>
      <StyleguideSection id="choices" title="Choice controls">
        <ChoiceShowcase />
      </StyleguideSection>
      <StyleguideSection
        id="overlays"
        title="Overlays"
        note="Phones use the drawer; desktops use popovers and side sheets."
      >
        <OverlayShowcase />
      </StyleguideSection>
      <StyleguideSection id="feedback" title="Feedback and states">
        <FeedbackShowcase />
      </StyleguideSection>
      <StyleguideSection id="data" title="Content blocks">
        <DataShowcase />
      </StyleguideSection>
      <StyleguideSection
        id="motion"
        title="Motion"
        note="Transform and opacity only; 150 ms fades under reduced motion."
      >
        <MotionShowcase />
      </StyleguideSection>
      <StyleguideSection
        id="media"
        title="Media"
        note="The video plays only when visible, never on Save-Data or slow connections."
      >
        <MediaShowcase />
      </StyleguideSection>
    </main>
  );
}
