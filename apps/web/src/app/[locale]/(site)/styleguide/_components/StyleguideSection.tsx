import type { ReactNode } from "react";

type StyleguideSectionProps = {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
};

/** One block of the dev-only styleguide: a heading, an optional note and the specimens. */
function StyleguideSection({ id, title, note, children }: StyleguideSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 border-t border-mist-200 pt-10"
    >
      <h2 id={`${id}-title`} className="type-h2 text-navy-900">
        {title}
      </h2>
      {note ? <p className="mt-2 max-w-[70ch] text-[15px] text-mist-600">{note}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export { StyleguideSection };
