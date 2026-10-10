import type { ReactNode } from "react";

/** Picker row mark: a 36 px mist circle holding a lucide icon. Decorative. */
function OptionIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-mist-100 text-brand-700 [&_svg]:size-4"
    >
      {children}
    </span>
  );
}

export { OptionIcon };
